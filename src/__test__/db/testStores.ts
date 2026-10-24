import { randomUUID } from "node:crypto";

import { DeleteTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { afterEach, beforeEach, inject } from "vitest";

import { setStoreForTests } from "@/utils/store";
import { ensureTable } from "@/utils/store/dynamoClient";
import { createDynamoStore } from "@/utils/store/dynamoStore";
import type { Store } from "@/utils/store/types";

export type Backend = "dynamodb";
/** The backends the server suites run on (`describe.each(BACKENDS)`). */
export const BACKENDS: Backend[] = ["dynamodb"];

/** The running test's Store and table, for `rawData` (writes the Store API cannot make). */
export type TestBackend = {
  backend: Backend;
  store: Store;
  client: DynamoDBClient;
  tableName: string;
};

let current: TestBackend | null = null;

export const currentTestBackend = (): TestBackend => {
  if (!current) throw new Error("No test Store: call useTestStore(backend) in the describe");
  return current;
};

/**
 * A fresh Store for every test on its own DynamoDB Local table, dropped after
 * the test. It is also what `getStore()` returns during the test, so intakes
 * and API handlers run on it. Call once inside a `describe` (usually
 * `describe.each(BACKENDS)`); read the Store through the returned getter.
 */
export const useTestStore = (backend: Backend): (() => Store) => {
  beforeEach(async () => {
    const client = new DynamoDBClient({
      region: "ap-southeast-2",
      endpoint: inject("dynamoEndpoint"),
      credentials: { accessKeyId: "local", secretAccessKey: "local" },
    });
    const tableName = `test-${randomUUID()}`;
    await ensureTable(client, tableName);
    current = { backend, store: createDynamoStore({ client, tableName }), client, tableName };
    setStoreForTests(current.store);
  });
  afterEach(async () => {
    setStoreForTests(null);
    if (!current) return;
    await current.client.send(new DeleteTableCommand({ TableName: current.tableName }));
    current.client.destroy();
    current = null;
  });
  return () => currentTestBackend().store;
};
