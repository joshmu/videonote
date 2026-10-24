import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import { Project, Share, User } from "@/utils/mongoose";
import { items, keys } from "@/utils/store/dynamoStore";
import type { Id } from "@/utils/store/types";

import { testId } from "./seed";
import { currentTestBackend } from "./testStores";

/**
 * Data the Store API cannot write: what legacy or half-removed records look
 * like on the running test's backend. Tests reach for these only to show how
 * the app reads such data; everything else is seeded through the Store. The
 * `mongo` branches go when the Mongo backend does.
 */
export const rawData = () => {
  const target = currentTestBackend();
  const dynamo = () => {
    if (target.backend !== "dynamodb") throw new Error("not on DynamoDB");
    return {
      db: DynamoDBDocumentClient.from(target.client),
      TableName: target.tableName,
    };
  };

  return {
    /** Make the User's Project list exactly `projectIds`, whoever owns them. */
    listProjects: async (userId: Id, projectIds: Id[]): Promise<void> => {
      if (target.backend === "mongo") {
        await User.updateOne({ _id: userId }, { $set: { projects: projectIds } });
        return;
      }
      const { db, TableName } = dynamo();
      await db.send(
        new UpdateCommand({
          TableName,
          Key: keys.user(userId),
          UpdateExpression: "SET projectIds = :ids",
          ExpressionAttributeValues: { ":ids": projectIds },
          ConditionExpression: "attribute_exists(PK)",
        }),
      );
    },

    /** Delete only the Project itself, leaving its Notes and its Share's url behind. */
    removeProjectOnly: async (projectId: Id): Promise<void> => {
      if (target.backend === "mongo") {
        await Project.deleteOne({ _id: projectId });
        return;
      }
      const { db, TableName } = dynamo();
      await db.send(new DeleteCommand({ TableName, Key: keys.project(projectId) }));
    },

    /** A Share at `url` that names the Project, though the Project's own Share is another. */
    addStaleShareUrl: async (projectId: Id, url: string): Promise<void> => {
      if (target.backend === "mongo") {
        const project = await Project.findById(projectId).lean();
        await Share.create({ url, project: projectId, user: project?.user });
        return;
      }
      const { db, TableName } = dynamo();
      const stale = { _id: testId(), url } as Parameters<typeof items.shareClaim>[1];
      await db.send(
        new PutCommand({
          TableName,
          Item: items.shareClaim(projectId, stale),
          ConditionExpression: "attribute_not_exists(PK)",
        }),
      );
    },
  };
};
