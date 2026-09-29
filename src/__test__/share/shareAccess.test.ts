import { describe, expect, it } from "vitest";

import { Note, Project, Share, User } from "@/utils/mongoose";
import { mayEditViaShare, openSharedProject } from "@/utils/share/shareAccess";
import { attachOrUpdateShare } from "@/utils/share/shareIntake";

import { useTestJwtSecret } from "../api/http";
import { useTestDb } from "../db/testDb";

useTestDb();
useTestJwtSecret();

const seedSharedProject = async (share: { password?: string; canEdit?: boolean } = {}) => {
  const owner = await User.create({ email: "owner@example.com", username: "owner" });
  const project = await Project.create({ title: "Rough cut", src: "cut.mp4", user: owner._id });
  const authored = await Note.create({
    content: "Trim the intro",
    time: 12,
    project: project._id,
    user: owner._id,
  });
  const guestNote = await Note.create({ content: "Louder", time: 30, project: project._id });
  project.notes.push(authored._id, guestNote._id);
  await project.save();
  await attachOrUpdateShare(project, { url: "rough-cut", ...share });
  return { owner, project: await Project.findById(project._id) };
};

describe("openSharedProject", () => {
  it("returns notFound for an unknown share url", async () => {
    await seedSharedProject();

    expect(await openSharedProject("nope", undefined)).toEqual({ kind: "notFound" });
  });

  it("returns notFound when the share url is not a string", async () => {
    await seedSharedProject();

    expect(await openSharedProject({ $ne: null }, undefined)).toEqual({ kind: "notFound" });
  });

  it("returns notFound when the shared Project has been deleted", async () => {
    const { project } = await seedSharedProject();
    await Project.deleteOne({ _id: project._id });

    expect(await openSharedProject("rough-cut", undefined)).toEqual({ kind: "notFound" });
  });

  it("returns notFound for a Share the Project no longer points at", async () => {
    const { owner, project } = await seedSharedProject();
    await Share.create({ url: "stale", user: owner._id, project: project._id });

    expect(await openSharedProject("stale", undefined)).toEqual({ kind: "notFound" });
  });

  it("serves a legacy Note that has no project field", async () => {
    const { project } = await seedSharedProject();
    const legacy = await Note.create({ content: "Legacy" });
    await Project.updateOne({ _id: project._id }, { $push: { notes: legacy._id } });

    const result = await openSharedProject("rough-cut", undefined);

    if (result.kind !== "ok") throw new Error(`expected ok, got ${result.kind}`);
    expect(result.project.notes[2]).toMatchObject({
      content: "Legacy",
      project: project._id.toString(),
    });
  });

  it("returns passwordRequired when the Share is protected and no password is given", async () => {
    await seedSharedProject({ password: "hunter2" });

    expect(await openSharedProject("rough-cut", undefined)).toEqual({ kind: "passwordRequired" });
  });

  it("returns incorrect for a wrong password", async () => {
    await seedSharedProject({ password: "hunter2" });

    expect(await openSharedProject("rough-cut", "wrong")).toEqual({ kind: "incorrect" });
  });

  it("opens a protected Share with the right password", async () => {
    await seedSharedProject({ password: "hunter2" });

    const result = await openSharedProject("rough-cut", "hunter2");

    expect(result.kind).toBe("ok");
  });

  it("returns the public projection of an open Share", async () => {
    const { owner, project } = await seedSharedProject({ canEdit: false });

    const result = await openSharedProject("rough-cut", undefined);

    if (result.kind !== "ok") throw new Error(`expected ok, got ${result.kind}`);
    expect(result.project).toEqual({
      _id: project._id.toString(),
      title: "Rough cut",
      src: "cut.mp4",
      share: { _id: project.share.toString(), url: "rough-cut", canEdit: false },
      notes: [
        expect.objectContaining({
          content: "Trim the intro",
          time: 12,
          done: false,
          project: project._id.toString(),
          user: { _id: owner._id.toString(), username: "owner" },
        }),
        expect.objectContaining({ content: "Louder", time: 30 }),
      ],
    });
    expect(result.project.notes[1]).not.toHaveProperty("user");
    const wire = JSON.stringify(result.project);
    expect(wire).not.toContain("password");
    expect(wire).not.toContain("owner@example.com");
  });

  it("shows a note author whose username is their email address by id only", async () => {
    const { project } = await seedSharedProject();
    const author = await User.create({ email: "casey@example.com", username: "casey@example.com" });
    await Note.updateMany({ project: project._id }, { $set: { user: author._id } });

    const result = await openSharedProject("rough-cut", undefined);

    if (result.kind !== "ok") throw new Error(`expected ok, got ${result.kind}`);
    const authorOnly = { _id: author._id.toString() };
    expect(result.project.notes.map((note) => note.user)).toEqual([authorOnly, authorOnly]);
    expect(JSON.stringify(result.project)).not.toContain("casey@example.com");
  });
});

describe("mayEditViaShare", () => {
  it("allows edits when the Project's Share has canEdit", async () => {
    const { project } = await seedSharedProject({ canEdit: true });

    expect(await mayEditViaShare(project, undefined)).toEqual({ kind: "allowed" });
  });

  it("asks for the password on a protected Share without a valid Share token", async () => {
    const { project } = await seedSharedProject({ canEdit: true, password: "hunter2" });
    const opened = await openSharedProject("rough-cut", "hunter2");
    if (opened.kind !== "ok") throw new Error(`expected ok, got ${opened.kind}`);

    expect(await mayEditViaShare(project, undefined)).toEqual({ kind: "passwordRequired" });
    expect(await mayEditViaShare(project, "not-a-token")).toEqual({ kind: "passwordRequired" });
    expect(await mayEditViaShare(project, opened.shareToken)).toEqual({ kind: "allowed" });
  });

  it("denies edits when the Project's Share has canEdit false", async () => {
    const { project } = await seedSharedProject({ canEdit: false });

    expect(await mayEditViaShare(project, undefined)).toEqual({ kind: "forbidden" });
  });

  it("denies edits when the Project has no Share", async () => {
    const owner = await User.create({ email: "solo@example.com", username: "solo" });
    const project = await Project.create({ title: "Private", user: owner._id });

    expect(await mayEditViaShare(project, undefined)).toEqual({ kind: "forbidden" });
  });

  it("denies edits through a Share that belongs to another Project", async () => {
    const { project } = await seedSharedProject({ canEdit: true });
    const other = await Project.create({
      title: "Other",
      user: project.user,
      share: project.share,
    });

    expect(await mayEditViaShare(other, undefined)).toEqual({ kind: "forbidden" });
    expect(await Share.countDocuments()).toBe(1);
  });
});
