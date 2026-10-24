import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import { items, keys } from "@/utils/store/dynamoStore";
import type { Id } from "@/utils/store/types";

import { testId } from "./seed";
import { currentTestBackend } from "./testStores";

/**
 * Data the Store API cannot write: what legacy or half-removed records look
 * like in the running test's table. Tests reach for these only to show how
 * the app reads such data; everything else is seeded through the Store.
 */
export const rawData = () => {
  const { client, tableName: TableName } = currentTestBackend();
  const db = DynamoDBDocumentClient.from(client);

  return {
    /** Make the User's Project list exactly `projectIds`, whoever owns them. */
    listProjects: async (userId: Id, projectIds: Id[]): Promise<void> => {
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
      await db.send(new DeleteCommand({ TableName, Key: keys.project(projectId) }));
    },

    /** A Share at `url` that names the Project, though the Project's own Share is another. */
    addStaleShareUrl: async (projectId: Id, url: string): Promise<void> => {
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
