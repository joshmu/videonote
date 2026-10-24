import { randomUUID } from "node:crypto";

import { DeleteTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { afterEach, beforeEach, inject } from "vitest";

import { setStoreForTests } from "@/utils/store";
import { ensureTable } from "@/utils/store/dynamoClient";
import { createDynamoStore } from "@/utils/store/dynamoStore";
import { createMongoStore } from "@/utils/store/mongoStore";
import type { Store } from "@/utils/store/types";

import { useTestDb } from "./testDb";

export type Backend = "mongo" | "dynamodb";
export const BACKENDS: Backend[] = ["mongo", "dynamodb"];

/** The backend the running test's Store is on, for `rawData` (writes the Store API cannot make). */
export type TestBackend =
  | { backend: "mongo"; store: Store }
  | { backend: "dynamodb"; store: Store; client: DynamoDBClient; tableName: string };

let current: TestBackend | null = null;

export const currentTestBackend = (): TestBackend => {
  if (!current) throw new Error("No test Store: call useTestStore(backend) in the describe");
  return current;
};

/**
 * A fresh Store on `backend` for every test: its own Mongo database (emptied
 * after each test) or its own DynamoDB Local table (dropped after each test).
 * It is also what `getStore()` returns during the test, so intakes and API
 * handlers run on it. Call once inside a `describe` (usually
 * `describe.each(BACKENDS)`); read the Store through the returned getter.
 */
export const useTestStore = (backend: Backend): (() => Store) => {
  afterEach(() => {
    setStoreForTests(null);
    current = null;
  });

  if (backend === "mongo") {
    useTestDb();
    beforeEach(async () => {
      current = { backend, store: await createMongoStore() };
      setStoreForTests(current.store);
    });
    return () => currentTestBackend().store;
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
    current = { backend, store: createDynamoStore({ client, tableName }), client, tableName };
    setStoreForTests(current.store);
  });
  afterEach(async () => {
    await client.send(new DeleteTableCommand({ TableName: tableName }));
    client.destroy();
  });
  return () => currentTestBackend().store;
};
