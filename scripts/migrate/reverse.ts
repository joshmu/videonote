import mongoose from "mongoose";

import { connectMongo } from "./mongo";
import { scanAll, type TableTarget, tableClient } from "./table";

type Item = Record<string, any>;

const oid = (id: string) => new mongoose.Types.ObjectId(id);
const optionalOid = (id: unknown) => (typeof id === "string" && id ? oid(id) : undefined);

/**
 * Rollback after a cut-over: copy every User, Project (with its Share and
 * Notes list) and Note changed on DynamoDB after `since` back to MongoDB, as
 * the Mongo store would have written them. Deletions made on DynamoDB are
 * listed, not applied: compare them with the cut-over snapshot by hand.
 */
export const reverse = async (
  target: TableTarget,
  since: string,
  { dryRun }: { dryRun: boolean },
) => {
  const table = await scanAll(tableClient(target), target.tableName);
  const changed = (item: Item) => typeof item.updatedAt === "string" && item.updatedAt > since;
  const users = table.filter((item) => item.type === "user" && changed(item));
  const notes = table.filter((item) => item.type === "note");
  const changedNotes = notes.filter(changed);
  // A Project's Notes list changes when a Note is added or removed, so a Project
  // with any changed Note is rewritten too.
  const touchedProjects = new Set(changedNotes.map((note) => note.projectId));
  const projects = table.filter(
    (item) => item.type === "project" && (changed(item) || touchedProjects.has(item._id)),
  );
  const summary = {
    users: users.length,
    projects: projects.length,
    notes: changedNotes.length,
    dryRun,
  };
  if (dryRun) return summary;

  const db = await connectMongo();
  const upsert = (collection: string, _id: string, fields: Item, createdAt?: string) =>
    db
      .collection(collection)
      .updateOne(
        { _id: oid(_id) },
        { $set: fields, ...(createdAt && { $setOnInsert: { createdAt: new Date(createdAt) } }) },
        { upsert: true },
      );

  for (const user of users) {
    if (user.settings) {
      const { _id, createdAt, updatedAt, currentProject, ...fields } = user.settings;
      await upsert("settings", _id, {
        ...fields,
        user: oid(user._id),
        ...(currentProject && { currentProject: oid(currentProject) }),
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
      });
    }
    await upsert(
      "users",
      user._id,
      {
        email: user.email,
        username: user.username,
        password: user.passwordHash,
        role: user.role,
        projects: (user.projectIds ?? []).map(oid),
        settings: optionalOid(user.settings?._id) ?? null,
        updatedAt: new Date(user.updatedAt),
      },
      user.createdAt,
    );
  }

  for (const project of projects) {
    const noteIds = notes
      .filter((note) => note.projectId === project._id)
      .sort((a, b) => a._id.localeCompare(b._id))
      .map((note) => oid(note._id));
    const share = project.share;
    if (share) {
      await upsert("shares", share._id, {
        url: share.url,
        canEdit: share.canEdit,
        password: share.passwordHash,
        project: oid(project._id),
        user: oid(project.ownerId),
        createdAt: new Date(share.createdAt),
        updatedAt: new Date(share.updatedAt),
      });
    }
    await db.collection("shares").deleteMany({
      project: oid(project._id),
      ...(share && { _id: { $ne: oid(share._id) } }),
    });
    await upsert(
      "projects",
      project._id,
      {
        title: project.title,
        src: project.src,
        user: oid(project.ownerId),
        share: share ? oid(share._id) : null,
        notes: noteIds,
        updatedAt: new Date(project.updatedAt),
      },
      project.createdAt,
    );
  }

  for (const note of changedNotes) {
    await upsert("notes", note._id, {
      content: note.content,
      time: note.time,
      done: note.done,
      project: oid(note.projectId),
      user: optionalOid(note.authorId) ?? null,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    });
  }
  return summary;
};
