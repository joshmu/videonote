import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

type Item = Record<string, any>;

export type TableTarget = { tableName: string; endpoint?: string };

/** A client for the migration: DynamoDB Local with an endpoint, else the AWS profile. */
export const tableClient = ({ endpoint }: TableTarget) =>
  new DynamoDBClient({
    region: process.env.AWS_REGION ?? "ap-southeast-2",
    // Ride out throttling on a provisioned table instead of failing the run.
    retryMode: "adaptive",
    maxAttempts: 12,
    ...(endpoint && { endpoint, credentials: { accessKeyId: "local", secretAccessKey: "local" } }),
  });

const docClient = (client: DynamoDBClient) =>
  DynamoDBDocumentClient.from(client, { marshallOptions: { removeUndefinedValues: true } });

export const keyOf = (item: Item) => `${item.PK}|${item.SK}`;

// Attribute order must not make two equal items look different.
const canonical = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical((value as Item)[key])]),
    );
  }
  return value;
};
export const sameItem = (a: Item, b: Item) =>
  JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

export const scanAll = async (client: DynamoDBClient, tableName: string): Promise<Item[]> => {
  const db = docClient(client);
  const found: Item[] = [];
  let ExclusiveStartKey: Item | undefined;
  do {
    const page = await db.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey }));
    found.push(...(page.Items ?? []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return found;
};

// Each 1 KB of an item costs one write unit.
const writeUnits = (item: Item) =>
  Math.max(1, Math.ceil(Buffer.byteLength(JSON.stringify(item)) / 1024));
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Write `puts` and delete `deletes` in batches of 25, paced to about `wcu`
 * write units per second so the table's provisioned capacity is not drowned.
 */
export const writeBatches = async (
  client: DynamoDBClient,
  tableName: string,
  { puts, deletes }: { puts: Item[]; deletes: Item[] },
  { wcu, onProgress }: { wcu: number; onProgress?: (done: number, total: number) => void },
) => {
  const db = docClient(client);
  const requests = [
    ...puts.map((Item) => ({ request: { PutRequest: { Item } }, units: writeUnits(Item) })),
    ...deletes.map((item) => ({
      request: { DeleteRequest: { Key: { PK: item.PK, SK: item.SK } } },
      units: 1,
    })),
  ];
  let done = 0;
  for (let i = 0; i < requests.length; i += 25) {
    const batch = requests.slice(i, i + 25);
    const started = Date.now();
    let pending = batch.map((entry) => entry.request);
    for (let attempt = 0; pending.length > 0; attempt++) {
      if (attempt > 0) await sleep(Math.min(5000, 100 * 2 ** attempt));
      const result = await db.send(
        new BatchWriteCommand({ RequestItems: { [tableName]: pending } }),
      );
      pending = (result.UnprocessedItems?.[tableName] ?? []) as typeof pending;
    }
    done += batch.length;
    onProgress?.(done, requests.length);
    const units = batch.reduce((sum, entry) => sum + entry.units, 0);
    const minMs = (units / wcu) * 1000;
    const elapsed = Date.now() - started;
    if (elapsed < minMs) await sleep(minMs - elapsed);
  }
};

/** Put an item unless the table already holds a newer one (by `updatedAt`). */
export const putIfNotNewer = async (client: DynamoDBClient, tableName: string, item: Item) => {
  const db = docClient(client);
  try {
    await db.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
        ...(item.updatedAt
          ? {
              ConditionExpression: "attribute_not_exists(PK) OR updatedAt <= :at",
              ExpressionAttributeValues: { ":at": item.updatedAt },
            }
          : {}),
      }),
    );
    return true;
  } catch (error) {
    if ((error as { name?: string }).name === "ConditionalCheckFailedException") return false;
    throw error;
  }
};

/** Delete an item unless it changed after `since` (so writes made on DynamoDB survive). */
export const deleteIfNotChangedSince = async (
  client: DynamoDBClient,
  tableName: string,
  item: Item,
  since: string,
) => {
  const db = docClient(client);
  try {
    await db.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { PK: item.PK, SK: item.SK },
        ConditionExpression: "attribute_not_exists(updatedAt) OR updatedAt <= :since",
        ExpressionAttributeValues: { ":since": since },
      }),
    );
    return true;
  } catch (error) {
    if ((error as { name?: string }).name === "ConditionalCheckFailedException") return false;
    throw error;
  }
};
