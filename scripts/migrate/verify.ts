import { toAccountUser, toSettingsReply } from "@/utils/apiHelpers";
import { toOwnerProject } from "@/utils/project/ownerProject";
import { toPublicNote } from "@/utils/share/shareAccess";
import { createDynamoStore } from "@/utils/store/dynamoStore";
import { createMongoStore } from "@/utils/store/mongoStore";
import type { Store } from "@/utils/store/types";

import { type TableTarget, tableClient } from "./table";
import type { Snapshot } from "./transform";
import { toRecords } from "./transform";

// Note order is the only thing allowed to differ: the client sorts Notes by time.
const byId = <T extends { _id: string }>(list: T[]) =>
  [...list].sort((a, b) => a._id.localeCompare(b._id));

/** What `/api/auth` sends a User, as plain JSON. */
const account = async (store: Store, userId: string) => {
  const user = await store.getUser(userId);
  if (!user) return null;
  const projects = (await store.loadProjects(user.projectIds)).filter(
    (p) => p.ownerId === user._id,
  );
  return JSON.parse(
    JSON.stringify({
      ...toAccountUser(user),
      ...(user.settings && { settings: toSettingsReply(user._id, user.settings) }),
      projects: projects.map((project) => {
        const owner = toOwnerProject(project);
        return { ...owner, notes: byId(owner.notes) };
      }),
    }),
  );
};

/** What `/api/public_project` sends for a Share url, as plain JSON. */
const shared = async (store: Store, url: string) => {
  const found = await store.findShareByUrl(url);
  if (!found) return null;
  const view = await store.loadProject(found.projectId);
  if (!view?.share || view.share._id !== found.share._id) return null;
  return JSON.parse(
    JSON.stringify({
      _id: view._id,
      title: view.title,
      src: view.src,
      share: {
        _id: view.share._id,
        url: view.share.url,
        canEdit: view.share.canEdit,
        hasPassword: Boolean(view.share.passwordHash),
      },
      notes: byId(view.notes.map((note) => toPublicNote(note, view.ownerId))),
    }),
  );
};

const firstDifference = (a: unknown, b: unknown, at = "$"): string | null => {
  if (JSON.stringify(a) === JSON.stringify(b)) return null;
  if (a && b && typeof a === "object" && typeof b === "object") {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
      const found = firstDifference((a as never)[key], (b as never)[key], `${at}.${key}`);
      if (found) return found;
    }
  }
  // Paths only: values can hold user data.
  return at;
};

/**
 * Compare, for every User and Share the snapshot migrates, what the Mongo
 * store and the DynamoDB table would send to clients. Reports differences by
 * id and JSON path, never values.
 */
export const verify = async (
  snapshot: Snapshot,
  target: TableTarget,
  {
    concurrency = 4,
    onProgress,
  }: { concurrency?: number; onProgress?: (done: number, total: number) => void } = {},
) => {
  const mongo = await createMongoStore();
  const dynamo = createDynamoStore({ client: tableClient(target), tableName: target.tableName });
  const { users, projects } = toRecords(snapshot);

  const checks: Array<() => Promise<string | null>> = [
    ...users.map((user) => async () => {
      const [a, b] = await Promise.all([account(mongo, user._id), account(dynamo, user._id)]);
      const diff = firstDifference(a, b);
      if (diff) return `user ${user._id}: ${diff}`;
      const found = await dynamo.findUserByEmail(user.email);
      return found?._id === user._id ? null : `user ${user._id}: email lookup`;
    }),
    ...projects
      .filter((project) => project.share)
      .map((project) => async () => {
        const url = project.share!.url;
        const [a, b] = await Promise.all([shared(mongo, url), shared(dynamo, url)]);
        const diff = firstDifference(a, b);
        return diff ? `share on project ${project._id}: ${diff}` : null;
      }),
  ];

  const differences: string[] = [];
  let done = 0;
  const queue = [...checks];
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      for (let check = queue.shift(); check; check = queue.shift()) {
        const difference = await check();
        if (difference) differences.push(difference);
        onProgress?.(++done, checks.length);
      }
    }),
  );
  return { checked: checks.length, differences };
};
