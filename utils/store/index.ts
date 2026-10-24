import { dynamoClientFromEnv } from "./dynamoClient";
import { createDynamoStore } from "./dynamoStore";
import { createMongoStore } from "./mongoStore";
import type { Store } from "./types";

export type * from "./types";

const openStore = async (): Promise<Store> => {
  if (process.env.DATA_BACKEND !== "dynamodb") return createMongoStore();
  const tableName = process.env.DYNAMODB_TABLE;
  if (!tableName) throw new Error("DYNAMODB_TABLE is required when DATA_BACKEND=dynamodb");
  return createDynamoStore({ client: dynamoClientFromEnv(), tableName });
};

let opening: Promise<Store> | null = null;
let testStore: Store | null = null;

/**
 * The one way server code reaches the data. Opens the backend chosen by
 * `DATA_BACKEND` (`mongo`, the default, or `dynamodb`) once and reuses it; a
 * failed attempt is retried on the next call.
 */
export const getStore = (): Promise<Store> => {
  if (testStore) return Promise.resolve(testStore);
  opening ??= openStore().catch((error) => {
    opening = null;
    throw error;
  });
  return opening;
};

/**
 * Tests only: make `getStore()` return `store` until called with `null`.
 * `useTestStore` (src/__test__/db/testStores.ts) is the one caller.
 */
export const setStoreForTests = (store: Store | null): void => {
  testStore = store;
};
