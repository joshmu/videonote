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

    const stored = await Share.findOne({ url: "rough-cut" });
    expect(stored.project).toEqual(project._id);
    expect(stored.user).toEqual(owner._id);
    expect(await verifySharePassword(stored.password, "hunter2")).toEqual({ kind: "ok" });

    const hydrated = shared.toObject();
    expect(hydrated.share).toMatchObject({ _id: stored._id, url: "rough-cut", canEdit: true });
    expect(hydrated.notes).toEqual([
      expect.objectContaining({
        content: "Trim the intro",
        user: { _id: owner._id, username: "owner", email: "owner@example.com" },
      }),
    ]);
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
    const shareId = shared.share._id.toString();

    const detached = await detachShare(project, { _id: shareId });

    expect(detached.share).toBeNull();
    expect(await Share.findById(shareId)).toBeNull();
  });
});
