import { Types } from "mongoose";
import { describe, expect, it } from "vitest";

import { Note, Project, Share, User } from "@/utils/mongoose";
import { attachOrUpdateShare, detachShare, ShareUrlTakenError } from "@/utils/share/shareIntake";
import { verifySharePassword } from "@/utils/share/sharePassword";

import { useTestDb } from "../db/testDb";

useTestDb();

const seedProject = async () => {
  const owner = await User.create({ email: "owner@example.com", username: "owner" });
  const project = await Project.create({ title: "Rough cut", user: owner._id });
  const note = await Note.create({
    content: "Trim the intro",
    time: 12,
    project: project._id,
    user: owner._id,
  });
  project.notes.push(note._id);
  await project.save();
  return { owner, project };
};

describe("Share intake against the in-memory database", () => {
  it("attaches a password-protected Share and returns the project with its relations", async () => {
    const { owner, project } = await seedProject();

    const shared = await attachOrUpdateShare(project, { url: "rough-cut", password: "hunter2" });

    const stored = await Share.findOne({ url: "rough-cut" }).select("+password");
    expect(stored.project).toEqual(project._id);
    expect(stored.user).toEqual(owner._id);
    expect(await verifySharePassword(stored.password, "hunter2")).toEqual({ kind: "ok" });

    expect(shared.share).toEqual({
      _id: stored._id.toString(),
      url: "rough-cut",
      canEdit: true,
      hasPassword: true,
    });
    expect(shared.notes).toEqual([
      expect.objectContaining({
        content: "Trim the intro",
        user: { _id: owner._id.toString(), username: "owner", role: "owner" },
      }),
    ]);
    expect(JSON.stringify(shared)).not.toContain(stored.password);
    expect(JSON.stringify(shared)).not.toContain("owner@example.com");
  });

  it("rejects a url another Share already uses and leaves the project unshared", async () => {
    const { project } = await seedProject();
    const other = await Project.create({ title: "Other", user: project.user });
    await Share.init();
    await attachOrUpdateShare(other, { url: "taken" });

    await expect(attachOrUpdateShare(project, { url: "taken" })).rejects.toBeInstanceOf(
      ShareUrlTakenError,
    );

    expect((await Project.findById(project._id)).share).toBeUndefined();
    expect(await Share.countDocuments({ url: "taken" })).toBe(1);
  });

  it("detaches the Share, deleting it and clearing the project's reference", async () => {
    const { project } = await seedProject();
    const shared = await attachOrUpdateShare(project, { url: "rough-cut" });
    const shareId = (shared.share as { _id: string })._id;

    const detached = await detachShare(project, { _id: shareId });

    expect(detached.share).toBeNull();
    expect(await Share.findById(shareId)).toBeNull();
  });
});

describe("Share intake password handling", () => {
  it("stores no protection when the password is empty or omitted", async () => {
    const { project } = await seedProject();
    const other = await Project.create({ title: "Other", user: project.user });

    await attachOrUpdateShare(project, { url: "empty", password: "" });
    await attachOrUpdateShare(other, { url: "omitted" });

    for (const url of ["empty", "omitted"]) {
      const stored = await Share.findOne({ url }).select("+password");
      expect(await verifySharePassword(stored.password, undefined)).toEqual({ kind: "open" });
    }
  });

  it("updates the attached Share in place, hashing a rotated password", async () => {
    const { project } = await seedProject();
    await attachOrUpdateShare(project, { url: "rough-cut", password: "hunter2" });

    const updated = await attachOrUpdateShare(project, {
      url: "final-cut",
      canEdit: false,
      password: "rotated",
    });

    expect(await Share.countDocuments()).toBe(1);
    const stored = await Share.findOne({ url: "final-cut" }).select("+password");
    expect(stored.canEdit).toBe(false);
    expect(await verifySharePassword(stored.password, "rotated")).toEqual({ kind: "ok" });
    expect(updated.share).toMatchObject({ _id: stored._id.toString(), url: "final-cut" });
  });

  it("keeps the existing password when an update omits it", async () => {
    const { project } = await seedProject();
    await attachOrUpdateShare(project, { url: "rough-cut", password: "hunter2" });

    const updated = await attachOrUpdateShare(project, { url: "rough-cut", canEdit: false });

    const stored = await Share.findOne({ url: "rough-cut" }).select("+password");
    expect(await verifySharePassword(stored.password, "hunter2")).toEqual({ kind: "ok" });
    expect(updated.share).toMatchObject({ hasPassword: true });
  });

  it("removes the password when an update sends an empty one", async () => {
    const { project } = await seedProject();
    await attachOrUpdateShare(project, { url: "rough-cut", password: "hunter2" });

    const updated = await attachOrUpdateShare(project, { url: "rough-cut", password: "" });

    const stored = await Share.findOne({ url: "rough-cut" }).select("+password");
    expect(await verifySharePassword(stored.password, undefined)).toEqual({ kind: "open" });
    expect(updated.share).toMatchObject({ hasPassword: false });
  });

  it("does not load the password hash unless asked", async () => {
    const { project } = await seedProject();
    await attachOrUpdateShare(project, { url: "rough-cut", password: "hunter2" });

    expect((await Share.findOne({ url: "rough-cut" })).password).toBeUndefined();
  });

  it("only detaches a Share that belongs to the project", async () => {
    const { project } = await seedProject();
    const other = await Project.create({ title: "Other", user: project.user });
    const otherShared = await attachOrUpdateShare(other, { url: "other" });

    await detachShare(project, { _id: (otherShared.share as { _id: string })._id });

    expect(await Share.countDocuments({ url: "other" })).toBe(1);
  });
});

describe("Share intake writable fields", () => {
  const foreign = () => ({
    _id: new Types.ObjectId(),
    project: new Types.ObjectId(),
    user: new Types.ObjectId(),
  });

  it("ignores _id, project and user from the caller on create", async () => {
    const { owner, project } = await seedProject();
    const injected = foreign();

    await attachOrUpdateShare(project, { url: "rough-cut", ...injected } as never);

    const stored = await Share.findOne({ url: "rough-cut" });
    expect(stored._id).not.toEqual(injected._id);
    expect(stored.project).toEqual(project._id);
    expect(stored.user).toEqual(owner._id);
  });

  it("ignores _id, project and user from the caller on update", async () => {
    const { owner, project } = await seedProject();
    const shared = await attachOrUpdateShare(project, { url: "rough-cut" });

    await attachOrUpdateShare(project, {
      url: "final-cut",
      canEdit: false,
      ...foreign(),
    } as never);

    const stored = await Share.findById((shared.share as { _id: string })._id);
    expect(stored).toMatchObject({ url: "final-cut", canEdit: false });
    expect(stored.project).toEqual(project._id);
    expect(stored.user).toEqual(owner._id);
  });
});
