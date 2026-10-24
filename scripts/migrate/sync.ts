import {
  deleteIfNotChangedSince,
  keyOf,
  putIfNotNewer,
  sameItem,
  scanAll,
  type TableTarget,
  tableClient,
  writeBatches,
} from "./table";
import { type Snapshot, toItems, toRecords } from "./transform";

/** Make the table hold exactly the snapshot's items: write what differs, delete the rest. */
export const sync = async (
  snapshot: Snapshot,
  target: TableTarget,
  {
    dryRun = false,
    wcu = 15,
    onProgress,
  }: { dryRun?: boolean; wcu?: number; onProgress?: (done: number, total: number) => void } = {},
) => {
  const desired = toItems(toRecords(snapshot));
  const client = tableClient(target);
  const existing = new Map(
    (await scanAll(client, target.tableName)).map((item) => [keyOf(item), item]),
  );
  const wanted = new Set(desired.map(keyOf));
  const puts = desired.filter((item) => {
    const current = existing.get(keyOf(item));
    return !current || !sameItem(current, item);
  });
  const deletes = [...existing.values()].filter((item) => !wanted.has(keyOf(item)));
  if (!dryRun) await writeBatches(client, target.tableName, { puts, deletes }, { wcu, onProgress });
  return {
    wanted: desired.length,
    existing: existing.size,
    written: puts.length,
    deleted: deletes.length,
  };
};

/**
 * Apply the MongoDB changes between two snapshots (taken before and after a
 * cut-over) without undoing writes the app has since made on DynamoDB: an
 * item is put only if the table's copy is not newer, and deleted only if it
 * has not changed after `since`.
 */
export const delta = async (from: Snapshot, to: Snapshot, target: TableTarget, since: string) => {
  const before = new Map(toItems(toRecords(from)).map((item) => [keyOf(item), item]));
  const after = toItems(toRecords(to));
  const afterKeys = new Set(after.map(keyOf));
  const client = tableClient(target);
  const result = { written: 0, deleted: 0, kept: 0 };
  for (const item of after) {
    const old = before.get(keyOf(item));
    if (old && sameItem(old, item)) continue;
    if (await putIfNotNewer(client, target.tableName, item)) result.written++;
    else result.kept++;
  }
  for (const [key, item] of before) {
    if (afterKeys.has(key)) continue;
    if (await deleteIfNotChangedSince(client, target.tableName, item, since)) result.deleted++;
    else result.kept++;
  }
  return result;
};
