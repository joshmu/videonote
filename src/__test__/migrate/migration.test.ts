import { randomUUID } from "node:crypto";

import { DeleteTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Types } from "mongoose";
import { afterEach, beforeEach, describe, expect, inject, it } from "vitest";

import { Note, Project, Settings, Share, User } from "@/utils/mongoose";
import { ensureTable } from "@/utils/store/dynamoClient";
import { createDynamoStore } from "@/utils/store/dynamoStore";
import { createMongoStore } from "@/utils/store/mongoStore";

import { exportSnapshot } from "../../../scripts/migrate/mongo";
import { reverse } from "../../../scripts/migrate/reverse";
import { delta, sync } from "../../../scripts/migrate/sync";
import { toRecords } from "../../../scripts/migrate/transform";
import { verify } from "../../../scripts/migrate/verify";
import { useTestDb } from "../db/testDb";

useTestDb();

let endpoint: string;
let tableName: string;
let client: DynamoDBClient;

beforeEach(async () => {
  endpoint = inject("dynamoEndpoint");
  tableName = `migrate-${randomUUID()}`;
  client = new DynamoDBClient({
    region: "ap-southeast-2",
    endpoint,
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
  });
  await ensureTable(client, tableName);
});

afterEach(async () => {
  await client.send(new DeleteTableCommand({ TableName: tableName }));
  client.destroy();
});

const target = () => ({ tableName, endpoint });
const dynamo = () => createDynamoStore({ client, tableName });

/** Live-like data with every quirk the audit found: reordered lists, orphans, legacy fields. */
const seedMongo = async () => {
  const owner = await User.create({
    email: "owner@example.com",
    username: "owner",
    password: "hash",
  });
  const member = await User.create({ email: "member@example.com", username: "member@example.com" });
  const later = await Project.create({
    title: "Later",
    user: owner._id,
    src: "https://v.test/b.mp4",
  });
  const earlier = await Project.create({ title: "Earlier", user: owner._id });
  const ownerNote = await Note.create({
    content: "Trim",
    time: 4,
    project: earlier._id,
    user: owner._id,
  });
  const memberNote = await Note.create({
    content: "Louder",
    project: earlier._id,
    user: member._id,
  });
  const guestNote = await Note.create({ content: "Nice", project: earlier._id });
  // Legacy: nulls and no timestamps.
  const legacy = new Types.ObjectId();
  await Note.collection.insertOne({
    _id: legacy,
    content: "Old",
    time: null,
    done: null,
    project: earlier._id,
  });
  const unlisted = await Note.create({ content: "Unlisted", project: earlier._id });
  const share = await Share.create({
    url: "earlier",
    user: owner._id,
    project: earlier._id,
    password: "share-hash",
    canEdit: true,
  });
  earlier.notes = [ownerNote._id, memberNote._id, guestNote._id, legacy, new Types.ObjectId()];
  earlier.share = share._id;
  await earlier.save();
  const settings = await Settings.create({
    user: owner._id,
    currentProject: earlier._id,
    playOffset: 1,
  });
  // Listed in the reverse of creation order, as live data has it.
  owner.projects = [later._id, earlier._id];
  owner.settings = settings._id;
  await owner.save();
  const hidden = await Project.create({ title: "Hidden", user: owner._id });
  const ownerless = await Project.create({ title: "Ownerless", user: new Types.ObjectId() });
  await Settings.create({ user: new Types.ObjectId() });
  return { owner, member, earlier, later, hidden, ownerless, unlisted, legacy, ownerNote };
};

describe("migration", () => {
  it("migrates what the app can reach and reports the rest", async () => {
    const seeded = await seedMongo();

    const { report } = toRecords(await exportSnapshot());

    expect(report).toMatchObject({ users: 2, projects: 2, notes: 4, shares: 1, settings: 1 });
    expect(report.skipped).toMatchObject({
      projectsNotInOwnerList: [seeded.hidden.id],
      projectsOwnerMissing: [seeded.ownerless.id],
      noteRefsDangling: 1,
      notesNotListed: [seeded.unlisted.id],
      settingsNotLinked: [expect.any(String)],
    });
  });

  it("syncs a table that then serves every User and Share exactly as MongoDB does", async () => {
    const seeded = await seedMongo();
    const snapshot = await exportSnapshot();

    const first = await sync(snapshot, target(), { wcu: 1000 });
    expect(first.written).toBe(first.wanted);

    const result = await verify(snapshot, target());
    expect(result.differences).toEqual([]);
    expect(result.checked).toBe(3);

    // The Users' own order and the legacy Note come across as the app reads them.
    expect((await dynamo().getUser(seeded.owner.id))?.projectIds).toEqual([
      seeded.later.id,
      seeded.earlier.id,
    ]);
    expect(await dynamo().getNote(seeded.legacy.toHexString())).toMatchObject({
      time: 0,
      done: false,
    });
    expect(await dynamo().findUserByEmail("member@example.com")).toMatchObject({
      _id: seeded.member.id,
    });

    // Idempotent: a second run has nothing to do.
    expect(await sync(snapshot, target(), { wcu: 1000 })).toMatchObject({ written: 0, deleted: 0 });
  });

  it("applies MongoDB changes made around the cut-over without undoing newer DynamoDB writes", async () => {
    const seeded = await seedMongo();
    const before = await exportSnapshot();
    await sync(before, target(), { wcu: 1000 });
    const since = new Date().toISOString();
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Written to MongoDB while the switch deploys.
    await Note.updateOne({ _id: seeded.ownerNote._id }, { $set: { content: "Trim more" } });
    await Project.updateOne({ _id: seeded.later._id }, { $set: { title: "Later (renamed)" } });
    await createMongoStore().then((mongo) =>
      mongo.removeProject({
        ...toRecords(before).projects.find((p) => p._id === seeded.earlier.id)!,
      }),
    );
    const after = await exportSnapshot();
    // Already written on DynamoDB after the switch: must survive.
    await dynamo().updateProject(seeded.later.id, { src: "https://v.test/new.mp4" });

    await delta(before, after, target(), since);

    expect(await dynamo().getNote(seeded.ownerNote.id)).toBeNull();
    expect(await dynamo().getProject(seeded.earlier.id)).toBeNull();
    expect(await dynamo().findShareByUrl("earlier")).toBeNull();
    const later = await dynamo().getProject(seeded.later.id);
    // DynamoDB's own later write wins over the older MongoDB rename.
    expect(later?.src).toBe("https://v.test/new.mp4");
    expect((await dynamo().getUser(seeded.owner.id))?.projectIds).toEqual([seeded.later.id]);
  });

  it("copies DynamoDB writes made after the cut-over back to MongoDB for a rollback", async () => {
    const seeded = await seedMongo();
    await sync(await exportSnapshot(), target(), { wcu: 1000 });
    const since = new Date().toISOString();
    await new Promise((resolve) => setTimeout(resolve, 10));

    const store = dynamo();
    const created = await store.createProject(seeded.owner.id, { title: "Made on DynamoDB" });
    await store.createNote({
      _id: new Types.ObjectId().toHexString(),
      projectId: created._id,
      content: "New",
      time: 1,
      done: false,
      authorId: seeded.member.id,
    });
    await store.putShare(created._id, { url: "made-on-dynamo" });
    await store.updateProfile(seeded.member.id, { username: "renamed" });

    await reverse(target(), since, { dryRun: false });

    const mongo = await createMongoStore();
    const view = await mongo.loadProject(created._id);
    expect(view).toMatchObject({ title: "Made on DynamoDB", share: { url: "made-on-dynamo" } });
    expect(view?.notes.map((note) => note.content)).toEqual(["New"]);
    expect((await mongo.getUser(seeded.owner.id))?.projectIds).toEqual([
      seeded.later.id,
      seeded.earlier.id,
      created._id,
    ]);
    expect((await mongo.getUser(seeded.member.id))?.username).toBe("renamed");
    expect((await mongo.findShareByUrl("made-on-dynamo"))?.projectId).toBe(created._id);
  });
});
