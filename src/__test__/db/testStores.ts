import { randomUUID } from "node:crypto";

import { DeleteTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { afterEach, beforeEach, inject } from "vitest";

import { ensureTable } from "@/utils/store/dynamoClient";
import { createDynamoStore } from "@/utils/store/dynamoStore";
import { createMongoStore } from "@/utils/store/mongoStore";
import type { Store } from "@/utils/store/types";

import { useTestDb } from "./testDb";

export type Backend = "mongo" | "dynamodb";
export const BACKENDS: Backend[] = ["mongo", "dynamodb"];

/**
 * A fresh Store on `backend` for every test: its own Mongo database (emptied
 * after each test) or its own DynamoDB Local table (dropped after each test).
 * Call inside a `describe`; read the Store through the returned getter.
 */
export const useTestStore = (backend: Backend): (() => Store) => {
  let store: Store;
  if (backend === "mongo") {
    useTestDb();
    beforeEach(async () => {
      store = await createMongoStore();
    });
    return () => store;
  }

  let client: DynamoDBClient;
  let tableName: string;
  beforeEach(async () => {
    client = new DynamoDBClient({
      region: "ap-southeast-2",
      endpoint: inject("dynamoEndpoint"),
      credentials: { accessKeyId: "local", secretAccessKey: "local" },
    });
    tableName = `test-${randomUUID()}`;
    await ensureTable(client, tableName);
    store = createDynamoStore({ client, tableName });
  });
  afterEach(async () => {
    await client.send(new DeleteTableCommand({ TableName: tableName }));
    client.destroy();
  });
  return () => store;
};
