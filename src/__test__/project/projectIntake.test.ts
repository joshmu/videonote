import { Types } from "mongoose";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Note, Project, Share, User } from "@/utils/mongoose";
import type { OwnerShare } from "@/utils/project/ownerProject";
import {
  createProject,
  getProject,
  removeProject,
  removeUserProjects,
  shareProject,
  unshareProject,
  updateProject,
} from "@/utils/project/projectIntake";

import { useTestDb } from "../db/testDb";

useTestDb();

afterEach(() => {
  vi.restoreAllMocks();
});

const seedOwner = (email = "owner@example.com") => User.create({ email, username: email });

const seedProject = async (owner: { _id: Types.ObjectId }, title = "Rough cut") => {
  const project = await Project.create({ title, src: "https://v.test/a.mp4", user: owner._id });
  const note = await Note.create({ content: "Trim", project: project._id, user: owner._id });
  project.notes.push(note._id);
  await project.save();
  await User.updateOne({ _id: owner._id }, { $push: { projects: project._id } });
  return project;
};

describe("createProject", () => {
  it("writes only the editable fields and links the project to its owner", async () => {
    const owner = await seedOwner();
    const intruder = await seedOwner("intruder@example.com");
    const foreignId = new Types.ObjectId();

    const outcome = await createProject(owner._id, {
      title: "Rough cut",
      src: "https://v.test/a.mp4",
      user: intruder._id.toString(),
      notes: [foreignId.toString()],
      share: foreignId.toString(),
      sharedUsers: [intruder._id.toString()],
    });

    expect(outcome.kind).toBe("ok");
    const stored = await Project.findById(outcome.project._id).lean();
    expect(stored).toMatchObject({ title: "Rough cut", src: "https://v.test/a.mp4" });
    expect(stored.user).toEqual(owner._id);
    expect(stored.notes).toEqual([]);
    expect(stored.share).toBeUndefined();
    expect(stored.sharedUsers).toEqual([]);
    expect((await User.findById(owner._id)).projects).toEqual([stored._id]);
  });
});

describe("createProject validation", () => {
  it("reports invalid without a non-empty string title and creates nothing", async () => {
    const owner = await seedOwner();

    for (const input of [{}, { title: "" }, { title: "   " }, { title: 7 }]) {
      expect(await createProject(owner._id, input)).toEqual({ kind: "invalid", reason: "title" });
    }
    expect(await Project.countDocuments()).toBe(0);
    expect((await User.findById(owner._id)).projects).toEqual([]);
  });
});

describe("updateProject", () => {
  it("changes title and src only, ignoring owner, notes and share ids", async () => {
    const owner = await seedOwner();
    const project = await seedProject(owner);
    const intruder = await seedOwner("intruder@example.com");

    const outcome = await updateProject(owner._id, project._id.toString(), {
      title: "Final cut",
      src: "",
      user: intruder._id.toString(),
      notes: [],
      share: new Types.ObjectId().toString(),
    });

    expect(outcome.kind).toBe("ok");
    const stored = await Project.findById(project._id).lean();
    expect(stored).toMatchObject({ title: "Final cut", src: "" });
    expect(stored.user).toEqual(owner._id);
    expect(stored.notes).toEqual(project.notes);
    expect(stored.share).toBeUndefined();
  });

  it("reports notFound for a project owned by someone else", async () => {
    const owner = await seedOwner();
    const project = await seedProject(owner);
    const other = await seedOwner("other@example.com");

    const outcome = await updateProject(other._id, project._id.toString(), { title: "Hijack" });

    expect(outcome).toEqual({ kind: "notFound" });
    expect((await Project.findById(project._id)).title).toBe("Rough cut");
  });
});

describe("getProject", () => {
  it("returns the owned project with its relations", async () => {
    const owner = await seedOwner();
    const project = await seedProject(owner);

    const outcome = await getProject(owner._id, project._id.toString());

    expect(outcome.kind).toBe("ok");
    if (outcome.kind !== "ok") return;
    expect(outcome.project.notes).toEqual([
      expect.objectContaining({
        content: "Trim",
        user: { _id: owner._id.toString(), role: "owner" },
      }),
    ]);
  });

  it("reports notFound for an unowned, missing, malformed or non-string id", async () => {
    const owner = await seedOwner();
    const project = await seedProject(owner);
    const other = await seedOwner("other@example.com");
    const notFound = { kind: "notFound" };

    expect(await getProject(other._id, project._id.toString())).toEqual(notFound);
    expect(await getProject(owner._id, new Types.ObjectId().toString())).toEqual(notFound);
    expect(await getProject(owner._id, "not-an-id")).toEqual(notFound);
    expect(await getProject(owner._id, { $ne: null } as unknown as string)).toEqual(notFound);
    expect(await getProject(owner._id, undefined)).toEqual(notFound);
  });
});

describe("shareProject / unshareProject", () => {
  it("shares an owned project and reports urlTaken for a url already in use", async () => {
    const owner = await seedOwner();
    const first = await seedProject(owner, "First");
    const second = await seedProject(owner, "Second");
    await Share.init();

    const shared = await shareProject(owner._id, first._id.toString(), { url: "taken" });
    const clash = await shareProject(owner._id, second._id.toString(), { url: "taken" });

    expect(shared.kind).toBe("ok");
    expect(clash.kind).toBe("urlTaken");
    expect((await Project.findById(second._id)).share).toBeUndefined();
  });

  it("reports notFound when sharing or unsharing a project the caller does not own", async () => {
    const owner = await seedOwner();
    const project = await seedProject(owner);
    const other = await seedOwner("other@example.com");

    expect(await shareProject(other._id, project._id.toString(), { url: "x" })).toEqual({
      kind: "notFound",
    });
    expect(
      await unshareProject(other._id, project._id.toString(), {
        _id: new Types.ObjectId().toString(),
      }),
    ).toEqual({ kind: "notFound" });
    expect(await Share.countDocuments()).toBe(0);
  });

  it("reports invalid for a missing share or a malformed share id", async () => {
    const owner = await seedOwner();
    const project = await seedProject(owner);
    const invalid = { kind: "invalid", reason: "share" };

    expect(await shareProject(owner._id, project._id.toString(), undefined)).toEqual(invalid);
    expect(await unshareProject(owner._id, project._id.toString(), undefined)).toEqual(invalid);
    expect(
      await unshareProject(owner._id, project._id.toString(), {
        _id: { _bsontype: "ObjectId" } as never,
      }),
    ).toEqual(invalid);
  });

  it("unshares an owned project", async () => {
    const owner = await seedOwner();
    const project = await seedProject(owner);
    const shared = await shareProject(owner._id, project._id.toString(), { url: "cut" });
    if (shared.kind !== "ok") throw new Error("expected ok");

    const outcome = await unshareProject(owner._id, project._id.toString(), {
      _id: (shared.project.share as OwnerShare)._id,
    });

    expect(outcome.kind).toBe("ok");
    expect(await Share.countDocuments()).toBe(0);
  });
});

describe("removeProject", () => {
  const seedShared = async () => {
    const owner = await seedOwner();
    const project = await seedProject(owner);
    await shareProject(owner._id, project._id.toString(), { url: "cut" });
    return { owner, project };
  };

  const expectGone = async (owner: { _id: Types.ObjectId }, projectId: Types.ObjectId) => {
    expect(await Project.findById(projectId)).toBeNull();
    expect(await Note.countDocuments({ project: projectId })).toBe(0);
    expect(await Share.countDocuments({ project: projectId })).toBe(0);
    expect((await User.findById(owner._id)).projects).toEqual([]);
  };

  it("removes the notes, the share, the owner's ref and then the project", async () => {
    const { owner, project } = await seedShared();

    const outcome = await removeProject(owner._id, project._id.toString());

    expect(outcome.kind).toBe("ok");
    if (outcome.kind === "ok") expect(outcome.project._id).toBe(project._id.toString());
    await expectGone(owner, project._id);
  });

  it("reports notFound for a project the caller does not own and leaves it intact", async () => {
    const { project } = await seedShared();
    const other = await seedOwner("other@example.com");

    expect(await removeProject(other._id, project._id.toString())).toEqual({ kind: "notFound" });
    expect(await Project.findById(project._id)).not.toBeNull();
    expect(await Note.countDocuments({ project: project._id })).toBe(1);
  });

  it("fails without deleting the project when a step fails, and a re-run completes", async () => {
    const { owner, project } = await seedShared();
    vi.spyOn(Share, "deleteMany").mockRejectedValueOnce(new Error("share store down"));

    await expect(removeProject(owner._id, project._id.toString())).rejects.toThrow(
      "share store down",
    );
    expect(await Project.findById(project._id)).not.toBeNull();

    expect((await removeProject(owner._id, project._id.toString())).kind).toBe("ok");
    await expectGone(owner, project._id);
  });
});

describe("removeUserProjects", () => {
  it("cascades every project the user owns and nobody else's", async () => {
    const owner = await seedOwner();
    const a = await seedProject(owner, "A");
    const b = await seedProject(owner, "B");
    const other = await seedOwner("other@example.com");
    const kept = await seedProject(other, "Kept");

    await removeUserProjects(owner._id);

    expect(await Project.countDocuments({ _id: { $in: [a._id, b._id] } })).toBe(0);
    expect(await Note.countDocuments({ project: { $in: [a._id, b._id] } })).toBe(0);
    expect(await Project.findById(kept._id)).not.toBeNull();
    expect(await Note.countDocuments({ project: kept._id })).toBe(1);
  });
});
