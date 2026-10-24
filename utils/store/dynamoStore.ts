import { randomBytes } from "node:crypto";

import { DynamoDBClient, TransactionCanceledException } from "@aws-sdk/client-dynamodb";
import {
  BatchGetCommand,
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  type TransactWriteCommandInput,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import type {
  Author,
  Id,
  NoteRecord,
  NoteView,
  ProjectRecord,
  ProjectView,
  SettingsRecord,
  ShareRecord,
  Store,
  UserRecord,
} from "./types";

/**
 * One table per environment, keys `PK` / `SK`, no secondary indexes (see
 * docs/adr/0001-dynamodb-single-table.md). Claim items enforce uniqueness and
 * give id-only lookups:
 *
 * | Item        | PK                  | SK              |
 * |-------------|---------------------|-----------------|
 * | User        | `USER#<id>`         | `PROFILE`       |
 * | Email claim | `EMAIL#<email>`     | `EMAIL`         |
 * | Project     | `PROJECT#<id>`      | `PROJECT`       |
 * | Note        | `PROJECT#<project>` | `NOTE#<id>`     |
 * | Note claim  | `NOTE#<id>`         | `NOTE`          |
 * | Share claim | `SHARE#<url>`       | `SHARE`         |
 */
export const keys = {
  user: (id: Id) => ({ PK: `USER#${id}`, SK: "PROFILE" }),
  email: (email: string) => ({ PK: `EMAIL#${email}`, SK: "EMAIL" }),
  project: (id: Id) => ({ PK: `PROJECT#${id}`, SK: "PROJECT" }),
  note: (projectId: Id, id: Id) => ({ PK: `PROJECT#${projectId}`, SK: `NOTE#${id}` }),
  noteClaim: (id: Id) => ({ PK: `NOTE#${id}`, SK: "NOTE" }),
  shareClaim: (url: string) => ({ PK: `SHARE#${url}`, SK: "SHARE" }),
};

const ID = /^[0-9a-f]{24}$/i;
const validId = (id: unknown): id is Id => typeof id === "string" && ID.test(id);

/** A new id in the ObjectId format (seconds, then random), sorting by creation time. */
export const newId = (): Id =>
  Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, "0") + randomBytes(8).toString("hex");

const now = () => new Date().toISOString();

// Items hold dates as ISO strings; records hold Dates.
type Item = Record<string, any>;
const date = (value: unknown): Date => new Date(value as string);

const toSettings = (item: Item | null | undefined): SettingsRecord | null =>
  item
    ? {
        _id: item._id,
        currentProject: item.currentProject ?? undefined,
        playOffset: item.playOffset ?? undefined,
        showHints: item.showHints ?? true,
        seekJump: item.seekJump ?? undefined,
        sidebarWidth: item.sidebarWidth ?? undefined,
        createdAt: date(item.createdAt),
        updatedAt: date(item.updatedAt),
      }
    : null;

const toUser = (item: Item): UserRecord => ({
  _id: item._id,
  email: item.email,
  username: item.username ?? undefined,
  passwordHash: item.passwordHash ?? "",
  role: item.role ?? "free",
  projectIds: item.projectIds ?? [],
  settings: toSettings(item.settings),
  createdAt: date(item.createdAt),
  updatedAt: date(item.updatedAt),
});

const toShare = (item: Item | null | undefined): ShareRecord | null =>
  item
    ? {
        _id: item._id,
        url: item.url,
        canEdit: item.canEdit ?? true,
        passwordHash: item.passwordHash ?? "",
        createdAt: date(item.createdAt),
        updatedAt: date(item.updatedAt),
      }
    : null;

const toProject = (item: Item): ProjectRecord => ({
  _id: item._id,
  ownerId: item.ownerId,
  title: item.title,
  src: item.src ?? undefined,
  share: toShare(item.share),
  createdAt: date(item.createdAt),
  updatedAt: date(item.updatedAt),
});

const toNote = (item: Item): NoteRecord => ({
  _id: item._id,
  projectId: item.projectId,
  content: item.content,
  time: item.time ?? 0,
  done: item.done ?? false,
  ...(item.authorId && { authorId: item.authorId }),
  createdAt: date(item.createdAt),
  updatedAt: date(item.updatedAt),
});

/** Records to the items written for them, for the Store and the data migration alike. */
export const items = {
  user: (user: UserRecord): Item => ({
    ...keys.user(user._id),
    type: "user",
    _id: user._id,
    email: user.email,
    ...(user.username !== undefined && { username: user.username }),
    passwordHash: user.passwordHash,
    role: user.role,
    projectIds: user.projectIds,
    settings: user.settings ? settingsItem(user.settings) : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }),
  emailClaim: (user: Pick<UserRecord, "_id" | "email">): Item => ({
    ...keys.email(user.email),
    type: "emailClaim",
    userId: user._id,
  }),
  project: (project: ProjectRecord): Item => ({
    ...keys.project(project._id),
    type: "project",
    _id: project._id,
    ownerId: project.ownerId,
    title: project.title,
    ...(project.src !== undefined && { src: project.src }),
    share: project.share ? shareItem(project.share) : null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }),
  shareClaim: (projectId: Id, share: ShareRecord): Item => ({
    ...keys.shareClaim(share.url),
    type: "shareClaim",
    projectId,
    shareId: share._id,
  }),
  note: (note: NoteRecord): Item => ({
    ...keys.note(note.projectId, note._id),
    type: "note",
    _id: note._id,
    projectId: note.projectId,
    content: note.content,
    time: note.time,
    done: note.done,
    ...(note.authorId && { authorId: note.authorId }),
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  }),
  noteClaim: (note: Pick<NoteRecord, "_id" | "projectId">): Item => ({
    ...keys.noteClaim(note._id),
    type: "noteClaim",
    projectId: note.projectId,
  }),
};

function settingsItem(settings: SettingsRecord): Item {
  return {
    ...settings,
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString(),
  };
}

function shareItem(share: ShareRecord): Item {
  return {
    ...share,
    createdAt: share.createdAt.toISOString(),
    updatedAt: share.updatedAt.toISOString(),
  };
}

/** Which transaction items failed their condition, by index. */
const failedConditions = (error: unknown): boolean[] | null =>
  error instanceof TransactionCanceledException
    ? (error.CancellationReasons ?? []).map((reason) => reason.Code === "ConditionalCheckFailed")
    : null;

const isConditionFailure = (error: unknown): boolean =>
  (error as { name?: string })?.name === "ConditionalCheckFailedException";

const chunk = <T>(list: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) =>
    list.slice(i * size, (i + 1) * size),
  );

export type DynamoStoreOptions = { client: DynamoDBClient; tableName: string };

/** The Store over one DynamoDB table. */
export const createDynamoStore = ({ client, tableName }: DynamoStoreOptions): Store => {
  const db = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });
  const TableName = tableName;

  // Reads that may follow a write in the same request are strongly consistent.
  const get = async (key: Item): Promise<Item | null> =>
    (await db.send(new GetCommand({ TableName, Key: key, ConsistentRead: true }))).Item ?? null;

  const queryAll = async (input: {
    pk: string;
    skPrefix?: string;
    filterDone?: boolean;
  }): Promise<Item[]> => {
    const found: Item[] = [];
    let ExclusiveStartKey: Item | undefined;
    do {
      const page = await db.send(
        new QueryCommand({
          TableName,
          ConsistentRead: true,
          KeyConditionExpression: input.skPrefix ? "PK = :pk AND begins_with(SK, :sk)" : "PK = :pk",
          ...(input.filterDone && { FilterExpression: "done = :done" }),
          ExpressionAttributeValues: {
            ":pk": input.pk,
            ...(input.skPrefix && { ":sk": input.skPrefix }),
            ...(input.filterDone && { ":done": true }),
          },
          ExclusiveStartKey,
        }),
      );
      found.push(...(page.Items ?? []));
      ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return found;
  };

  const transact = (TransactItems: NonNullable<TransactWriteCommandInput["TransactItems"]>) =>
    db.send(new TransactWriteCommand({ TransactItems }));

  // BatchWrite takes 25 requests at a time and may hand some back unprocessed.
  const deleteAll = async (keyList: Item[]): Promise<void> => {
    for (const batch of chunk(keyList, 25)) {
      let requests = batch.map((Key) => ({ DeleteRequest: { Key } }));
      for (let attempt = 0; requests.length > 0; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, Math.min(1000, 50 * 2 ** attempt)));
        const result = await db.send(
          new BatchWriteCommand({ RequestItems: { [TableName]: requests } }),
        );
        requests = (result.UnprocessedItems?.[TableName] ?? []) as typeof requests;
      }
    }
  };

  // Resolve Note authors in batches of 100; a User that is gone resolves to nothing.
  const loadAuthors = async (authorIds: Id[]): Promise<Map<Id, Author>> => {
    const authors = new Map<Id, Author>();
    for (const batch of chunk([...new Set(authorIds)], 100)) {
      let Keys: Item[] = batch.map(keys.user);
      for (let attempt = 0; Keys.length > 0; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, Math.min(1000, 50 * 2 ** attempt)));
        const result = await db.send(
          new BatchGetCommand({
            RequestItems: {
              [TableName]: {
                Keys,
                ConsistentRead: true,
                ProjectionExpression: "#id, username, email",
                ExpressionAttributeNames: { "#id": "_id" },
              },
            },
          }),
        );
        for (const user of result.Responses?.[TableName] ?? []) {
          authors.set(user._id, {
            _id: user._id,
            username: user.username ?? undefined,
            email: user.email,
          });
        }
        Keys = (result.UnprocessedKeys?.[TableName]?.Keys ?? []) as Item[];
      }
    }
    return authors;
  };

  const withAuthors = async (noteItems: Item[]): Promise<NoteView[]> => {
    const notes = noteItems.map(toNote);
    const authors = await loadAuthors(notes.flatMap((note) => note.authorId ?? []));
    return notes.map((note) => {
      const author = note.authorId ? (authors.get(note.authorId) ?? null) : null;
      // An author id whose User is gone reads as a guest's Note.
      if (!author) delete note.authorId;
      return { ...note, author };
    });
  };

  const getUser: Store["getUser"] = async (id) => {
    if (!validId(id)) return null;
    const item = await get(keys.user(id));
    return item ? toUser(item) : null;
  };

  const getProject: Store["getProject"] = async (id) => {
    if (!validId(id)) return null;
    const item = await get(keys.project(id));
    return item ? toProject(item) : null;
  };

  const loadProject: Store["loadProject"] = async (id) => {
    if (!validId(id)) return null;
    const partition = await queryAll({ pk: keys.project(id).PK });
    const projectItem = partition.find((item) => item.SK === "PROJECT");
    if (!projectItem) return null;
    const notes = await withAuthors(partition.filter((item) => item.SK.startsWith("NOTE#")));
    return { ...toProject(projectItem), notes };
  };

  const getNote: Store["getNote"] = async (id) => {
    if (!validId(id)) return null;
    const claim = await get(keys.noteClaim(id));
    if (!claim) return null;
    const item = await get(keys.note(claim.projectId, id));
    return item ? toNote(item) : null;
  };

  return {
    getUser,

    findUserByEmail: async (email) => {
      const claim = await get(keys.email(email));
      return claim ? getUser(claim.userId) : null;
    },

    createUser: async ({ email, username, passwordHash }) => {
      const at = new Date();
      const user: UserRecord = {
        _id: newId(),
        email,
        username,
        passwordHash,
        role: "free",
        projectIds: [],
        settings: null,
        createdAt: at,
        updatedAt: at,
      };
      try {
        await transact([
          {
            Put: {
              TableName,
              Item: items.emailClaim(user),
              ConditionExpression: "attribute_not_exists(PK)",
            },
          },
          {
            Put: {
              TableName,
              Item: items.user(user),
              ConditionExpression: "attribute_not_exists(PK)",
            },
          },
        ]);
      } catch (error) {
        if (failedConditions(error)?.[0]) return "emailTaken";
        throw error;
      }
      return user;
    },

    updateProfile: async (id, changes) => {
      const user = await getUser(id);
      if (!user) throw new Error(`User ${id} not found`);
      const names: Record<string, string> = { "#updatedAt": "updatedAt" };
      const values: Record<string, unknown> = { ":updatedAt": now() };
      const sets = ["#updatedAt = :updatedAt"];
      for (const field of ["username", "email"] as const) {
        if (changes[field] === undefined) continue;
        names[`#${field}`] = field;
        values[`:${field}`] = changes[field];
        sets.push(`#${field} = :${field}`);
      }
      const update = {
        Update: {
          TableName,
          Key: keys.user(id),
          UpdateExpression: `SET ${sets.join(", ")}`,
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: values,
          ConditionExpression: "attribute_exists(PK)",
        },
      };
      if (changes.email === undefined || changes.email === user.email) {
        await transact([update]);
        return (await getUser(id))!;
      }
      try {
        await transact([
          {
            Put: {
              TableName,
              Item: items.emailClaim({ _id: id, email: changes.email }),
              ConditionExpression: "attribute_not_exists(PK)",
            },
          },
          { Delete: { TableName, Key: keys.email(user.email) } },
          update,
        ]);
      } catch (error) {
        if (failedConditions(error)?.[0]) return "emailTaken";
        throw error;
      }
      return (await getUser(id))!;
    },

    saveSettings: async (userId, changes) => {
      const user = await getUser(userId);
      if (!user) throw new Error(`User ${userId} not found`);
      const at = new Date();
      const settings: SettingsRecord = {
        ...(user.settings ?? { _id: newId(), showHints: true, createdAt: at }),
        ...Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined)),
        updatedAt: at,
      } as SettingsRecord;
      await db.send(
        new UpdateCommand({
          TableName,
          Key: keys.user(userId),
          UpdateExpression: "SET settings = :settings",
          ExpressionAttributeValues: { ":settings": settingsItem(settings) },
          ConditionExpression: "attribute_exists(PK)",
        }),
      );
      return settings;
    },

    removeUser: async (user) => {
      await db.send(new DeleteCommand({ TableName, Key: keys.email(user.email) }));
      await db.send(new DeleteCommand({ TableName, Key: keys.user(user._id) }));
    },

    createProject: async (ownerId, fields) => {
      const at = new Date();
      const project: ProjectRecord = {
        _id: newId(),
        ownerId,
        title: fields.title,
        ...(fields.src !== undefined && { src: fields.src }),
        share: null,
        createdAt: at,
        updatedAt: at,
      };
      await transact([
        {
          Put: {
            TableName,
            Item: items.project(project),
            ConditionExpression: "attribute_not_exists(PK)",
          },
        },
        {
          Update: {
            TableName,
            Key: keys.user(ownerId),
            UpdateExpression: "SET projectIds = list_append(if_not_exists(projectIds, :none), :id)",
            ExpressionAttributeValues: { ":id": [project._id], ":none": [] },
            ConditionExpression: "attribute_exists(PK)",
          },
        },
      ]);
      return project;
    },

    ownedProjectIds: async (ownerId) => (await getUser(ownerId))?.projectIds ?? [],

    getProject,
    loadProject,

    loadProjects: async (ids) => {
      const views = await Promise.all(ids.map((id) => loadProject(id)));
      return views.filter((view): view is ProjectView => view !== null);
    },

    updateProject: async (id, fields) => {
      if (!validId(id)) return null;
      const names: Record<string, string> = { "#updatedAt": "updatedAt" };
      const values: Record<string, unknown> = { ":updatedAt": now() };
      const sets = ["#updatedAt = :updatedAt"];
      for (const field of ["title", "src"] as const) {
        if (fields[field] === undefined) continue;
        names[`#${field}`] = field;
        values[`:${field}`] = fields[field];
        sets.push(`#${field} = :${field}`);
      }
      try {
        const { Attributes } = await db.send(
          new UpdateCommand({
            TableName,
            Key: keys.project(id),
            UpdateExpression: `SET ${sets.join(", ")}`,
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values,
            ConditionExpression: "attribute_exists(PK)",
            ReturnValues: "ALL_NEW",
          }),
        );
        return toProject(Attributes!);
      } catch (error) {
        if (isConditionFailure(error)) return null;
        throw error;
      }
    },

    removeProject: async (project) => {
      // Notes and their claims first, then the Share's url, the owner's list, the Project last.
      const notes = await queryAll({ pk: keys.project(project._id).PK, skPrefix: "NOTE#" });
      await deleteAll(
        notes.flatMap((note) => [keys.note(project._id, note._id), keys.noteClaim(note._id)]),
      );
      const current = await getProject(project._id);
      const share = current?.share ?? project.share;
      if (share) {
        try {
          await db.send(
            new DeleteCommand({
              TableName,
              Key: keys.shareClaim(share.url),
              ConditionExpression: "projectId = :projectId",
              ExpressionAttributeValues: { ":projectId": project._id },
            }),
          );
        } catch (error) {
          if (!isConditionFailure(error)) throw error;
        }
      }
      const owner = await getUser(project.ownerId);
      const index = owner?.projectIds.indexOf(project._id) ?? -1;
      if (index >= 0) {
        try {
          await db.send(
            new UpdateCommand({
              TableName,
              Key: keys.user(project.ownerId),
              UpdateExpression: `REMOVE projectIds[${index}]`,
              ConditionExpression: `projectIds[${index}] = :id`,
              ExpressionAttributeValues: { ":id": project._id },
            }),
          );
        } catch (error) {
          // The list moved under us; the re-run (or the next removal) finds the new index.
          if (!isConditionFailure(error)) throw error;
          throw new Error(`Project ${project._id} moved in its owner's list; retry the removal`);
        }
      }
      await db.send(new DeleteCommand({ TableName, Key: keys.project(project._id) }));
    },

    putShare: async (projectId, changes) => {
      const project = await getProject(projectId);
      if (!project) throw new Error(`Project ${projectId} not found`);
      const at = new Date();
      const current = project.share;
      const share: ShareRecord = current
        ? {
            ...current,
            ...(changes.url !== undefined && { url: changes.url }),
            ...(changes.canEdit !== undefined && { canEdit: changes.canEdit }),
            ...(changes.passwordHash !== undefined && { passwordHash: changes.passwordHash }),
            updatedAt: at,
          }
        : {
            _id: newId(),
            url: changes.url!,
            canEdit: changes.canEdit ?? true,
            passwordHash: changes.passwordHash ?? "",
            createdAt: at,
            updatedAt: at,
          };
      if (typeof share.url !== "string" || share.url === "") {
        throw new Error("A Share needs a url");
      }
      const setShare = {
        Update: {
          TableName,
          Key: keys.project(projectId),
          UpdateExpression: "SET #share = :share",
          ExpressionAttributeNames: { "#share": "share" },
          ExpressionAttributeValues: { ":share": shareItem(share) },
          ConditionExpression: "attribute_exists(PK)",
        },
      };
      if (current && current.url === share.url) {
        await transact([setShare]);
        return share;
      }
      try {
        await transact([
          {
            Put: {
              TableName,
              Item: items.shareClaim(projectId, share),
              ConditionExpression: "attribute_not_exists(PK)",
            },
          },
          ...(current ? [{ Delete: { TableName, Key: keys.shareClaim(current.url) } }] : []),
          setShare,
        ]);
      } catch (error) {
        if (failedConditions(error)?.[0]) return "urlTaken";
        throw error;
      }
      return share;
    },

    removeShare: async (projectId, shareId) => {
      const project = await getProject(projectId);
      if (!project?.share || project.share._id !== shareId) return;
      await transact([
        { Delete: { TableName, Key: keys.shareClaim(project.share.url) } },
        {
          Update: {
            TableName,
            Key: keys.project(projectId),
            UpdateExpression: "SET #share = :none",
            ConditionExpression: "#share.#id = :shareId",
            ExpressionAttributeNames: { "#share": "share", "#id": "_id" },
            ExpressionAttributeValues: { ":none": null, ":shareId": shareId },
          },
        },
      ]);
    },

    findShareByUrl: async (url) => {
      const claim = await get(keys.shareClaim(url));
      if (!claim) return null;
      const project = await getProject(claim.projectId);
      if (!project?.share || project.share._id !== claim.shareId) return null;
      return { share: project.share, projectId: claim.projectId };
    },

    getNote,

    loadNote: async (id) => {
      const note = await getNote(id);
      if (!note) return null;
      const item = await get(keys.note(note.projectId, id));
      return (await withAuthors([item!]))[0];
    },

    listNotes: async (projectId) => {
      if (!validId(projectId)) return [];
      return withAuthors(await queryAll({ pk: keys.project(projectId).PK, skPrefix: "NOTE#" }));
    },

    createNote: async ({ _id, projectId, content, time, done, authorId }) => {
      const at = new Date();
      const note: NoteRecord = {
        _id,
        projectId,
        content,
        time,
        done,
        ...(authorId && { authorId }),
        createdAt: at,
        updatedAt: at,
      };
      await transact([
        {
          Put: {
            TableName,
            Item: items.noteClaim(note),
            ConditionExpression: "attribute_not_exists(PK)",
          },
        },
        {
          Put: {
            TableName,
            Item: items.note(note),
            ConditionExpression: "attribute_not_exists(PK)",
          },
        },
        {
          ConditionCheck: {
            TableName,
            Key: keys.project(projectId),
            ConditionExpression: "attribute_exists(PK)",
          },
        },
      ]);
      return note;
    },

    updateNote: async (id, changes) => {
      const note = await getNote(id);
      if (!note) throw new Error(`Note ${id} not found`);
      const names: Record<string, string> = { "#updatedAt": "updatedAt" };
      const values: Record<string, unknown> = { ":updatedAt": now() };
      const sets = ["#updatedAt = :updatedAt"];
      for (const field of ["content", "time", "done"] as const) {
        if (changes[field] === undefined) continue;
        names[`#${field}`] = field;
        values[`:${field}`] = changes[field];
        sets.push(`#${field} = :${field}`);
      }
      const { Attributes } = await db.send(
        new UpdateCommand({
          TableName,
          Key: keys.note(note.projectId, id),
          UpdateExpression: `SET ${sets.join(", ")}`,
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: values,
          ConditionExpression: "attribute_exists(PK)",
          ReturnValues: "ALL_NEW",
        }),
      );
      return toNote(Attributes!);
    },

    removeDoneNotes: async (projectId) => {
      const done = await queryAll({
        pk: keys.project(projectId).PK,
        skPrefix: "NOTE#",
        filterDone: true,
      });
      await deleteAll(
        done.flatMap((note) => [keys.note(projectId, note._id), keys.noteClaim(note._id)]),
      );
    },
  };
};
