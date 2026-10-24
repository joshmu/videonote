// Mongo backend only: delete with utils/mongoose.ts and utils/store/mongoStore.ts.
// Document shapes only live MongoDB data has (DynamoDB items come from records,
// so they can't take these shapes), read through the intakes.
import { Types } from "mongoose";
import { describe, expect, it } from "vitest";

import { Note, Project, Share } from "@/utils/mongoose";
import { upsertNote } from "@/utils/note/noteIntake";
import { mayEditViaShare, openSharedProject } from "@/utils/share/shareAccess";
import { attachOrUpdateShare } from "@/utils/share/shareIntake";

import { useTestJwtSecret } from "../api/http";
import { seedNote, seedProject, seedUser } from "../db/seed";
import { useTestStore } from "../db/testStores";

useTestJwtSecret();

describe("legacy MongoDB documents", () => {
  const store = useTestStore("mongo");

  const seedShared = async (share: { canEdit?: boolean } = {}) => {
    const owner = await seedUser(store(), "owner@example.com", { username: "owner" });
    const project = await seedProject(store(), owner._id, { title: "Rough cut" });
    await seedNote(store(), project._id, { content: "Trim", authorId: owner._id });
    await attachOrUpdateShare(project, { url: "rough-cut", ...share });
    return (await store().getProject(project._id))!;
  };

  it("serves a Note that has no project field as the listing Project's", async () => {
    const project = await seedShared();
    const legacy = await Note.create({ content: "Legacy" });
    await Project.updateOne({ _id: project._id }, { $push: { notes: legacy._id } });

    const result = await openSharedProject("rough-cut", undefined);

    if (result.kind !== "ok") throw new Error(`expected ok, got ${result.kind}`);
    expect(result.project.notes[1]).toMatchObject({ content: "Legacy", project: project._id });
  });

  it("denies edits through a Share that belongs to another Project", async () => {
    const project = await seedShared({ canEdit: true });
    const other = await Project.create({
      title: "Other",
      user: project.ownerId,
      share: project.share!._id,
    });

    expect(mayEditViaShare((await store().getProject(other.id))!, undefined)).toEqual({
      kind: "forbidden",
    });
    expect(await Share.countDocuments()).toBe(1);
  });

  it("does not load a Share's password hash unless asked", async () => {
    const owner = await seedUser(store(), "owner@example.com");
    const project = await seedProject(store(), owner._id);
    await attachOrUpdateShare(project, { url: "rough-cut", password: "hunter2" });

    expect((await Share.findOne({ url: "rough-cut" }))!.password).toBeUndefined();
  });

  it.each([
    ["echoes the null done", { done: null }],
    ["omits done", {}],
  ])("edits a Note stored with a null done when the update %s", async (_l, fields) => {
    const owner = await seedUser(store(), "owner@example.com");
    const project = await seedProject(store(), owner._id);
    const note = await seedNote(store(), project._id, { authorId: owner._id });
    await Note.collection.updateOne(
      { _id: new Types.ObjectId(note._id) },
      {
        $set: { done: null },
      },
    );

    const result = await upsertNote(
      { _id: note._id, project: project._id, content: "Edited", ...fields } as never,
      owner._id,
    );

    expect(result.kind).toBe("ok");
    expect(
      (await Note.collection.findOne({ _id: new Types.ObjectId(note._id) })) as object,
    ).toMatchObject({ content: "Edited", done: null });
  });
});
