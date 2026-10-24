import { afterEach, describe, expect, it, vi } from "vitest";

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
import type { Id, ProjectRecord, Store } from "@/utils/store";

import { seedNote, seedProject as seedBareProject, seedUser, testId } from "../db/seed";
import { BACKENDS, useTestStore } from "../db/testStores";

afterEach(() => {
  vi.restoreAllMocks();
});

describe.each(BACKENDS)("Project intake: %s", (backend) => {
  const store = useTestStore(backend);

  const seedOwner = (email = "owner@example.com") => seedUser(store(), email);

  // A Project with one Note by its owner, at the end of the owner's list.
  const seedProject = async (owner: { _id: Id }, title = "Rough cut") => {
    const project = await seedBareProject(store(), owner._id, {
      title,
      src: "https://v.test/a.mp4",
    });
    const note = await seedNote(store(), project._id, { content: "Trim", authorId: owner._id });
    return { ...project, noteId: note._id };
  };

  describe("createProject", () => {
    it("writes only the editable fields and links the project to its owner", async () => {
      const owner = await seedOwner();
      const intruder = await seedOwner("intruder@example.com");
      const foreignId = testId();

      const outcome = await createProject(owner._id, {
        title: "Rough cut",
        src: "https://v.test/a.mp4",
        user: intruder._id,
        notes: [foreignId],
        share: foreignId,
        sharedUsers: [intruder._id],
      });

      if (outcome.kind !== "ok") throw new Error(`expected ok, got ${outcome.kind}`);
      const stored = await store().loadProject(outcome.project._id);
      expect(stored).toMatchObject({
        title: "Rough cut",
        src: "https://v.test/a.mp4",
        ownerId: owner._id,
        notes: [],
        share: null,
      });
      expect(stored).not.toHaveProperty("sharedUsers");
      expect((await store().getUser(owner._id))!.projectIds).toEqual([stored!._id]);
      expect((await store().getUser(intruder._id))!.projectIds).toEqual([]);
    });

    it("replies with an empty src for a project created without one", async () => {
      const owner = await seedOwner();

      const outcome = await createProject(owner._id, { title: "No video yet" });

      if (outcome.kind !== "ok") throw new Error(`expected ok, got ${outcome.kind}`);
      expect(outcome.project.src).toBe("");
    });
  });

  describe("createProject validation", () => {
    it("reports invalid without a non-empty string title and creates nothing", async () => {
      const owner = await seedOwner();

      for (const input of [{}, { title: "" }, { title: "   " }, { title: 7 }]) {
        expect(await createProject(owner._id, input)).toEqual({ kind: "invalid", reason: "title" });
      }
      expect(await store().ownedProjectIds(owner._id)).toEqual([]);
      expect((await store().getUser(owner._id))!.projectIds).toEqual([]);
    });
  });

  describe("updateProject", () => {
    it("changes title and src only, ignoring owner, notes and share ids", async () => {
      const owner = await seedOwner();
      const project = await seedProject(owner);
      const intruder = await seedOwner("intruder@example.com");

      const outcome = await updateProject(owner._id, project._id, {
        title: "Final cut",
        src: "",
        user: intruder._id,
        notes: [],
        share: testId(),
      });

      expect(outcome.kind).toBe("ok");
      const stored = await store().loadProject(project._id);
      expect(stored).toMatchObject({
        title: "Final cut",
        src: "",
        ownerId: owner._id,
        share: null,
      });
      expect(stored!.notes.map((note) => note._id)).toEqual([project.noteId]);
    });

    it("reports notFound for a project owned by someone else", async () => {
      const owner = await seedOwner();
      const project = await seedProject(owner);
      const other = await seedOwner("other@example.com");

      const outcome = await updateProject(other._id, project._id, { title: "Hijack" });

      expect(outcome).toEqual({ kind: "notFound" });
      expect((await store().getProject(project._id))!.title).toBe("Rough cut");
    });
  });

  describe("getProject", () => {
    it("returns the owned project with its relations", async () => {
      const owner = await seedOwner();
      const project = await seedProject(owner);

      const outcome = await getProject(owner._id, project._id);

      expect(outcome.kind).toBe("ok");
      if (outcome.kind !== "ok") return;
      expect(outcome.project.notes).toEqual([
        expect.objectContaining({
          content: "Trim",
          user: { _id: owner._id, role: "owner" },
        }),
      ]);
    });

    it("reports notFound for an unowned, missing, malformed or non-string id", async () => {
      const owner = await seedOwner();
      const project = await seedProject(owner);
      const other = await seedOwner("other@example.com");
      const notFound = { kind: "notFound" };

      expect(await getProject(other._id, project._id)).toEqual(notFound);
      expect(await getProject(owner._id, testId())).toEqual(notFound);
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

      const shared = await shareProject(owner._id, first._id, { url: "taken" });
      const clash = await shareProject(owner._id, second._id, { url: "taken" });

      expect(shared.kind).toBe("ok");
      expect(clash.kind).toBe("urlTaken");
      expect((await store().getProject(second._id))!.share).toBeNull();
      expect(await store().findShareByUrl("taken")).toMatchObject({ projectId: first._id });
    });

    it("reports notFound when sharing or unsharing a project the caller does not own", async () => {
      const owner = await seedOwner();
      const project = await seedProject(owner);
      const other = await seedOwner("other@example.com");

      expect(await shareProject(other._id, project._id, { url: "x" })).toEqual({
        kind: "notFound",
      });
      expect(await unshareProject(other._id, project._id, { _id: testId() })).toEqual({
        kind: "notFound",
      });
      expect(await store().findShareByUrl("x")).toBeNull();
      expect((await store().getProject(project._id))!.share).toBeNull();
    });

    it("reports invalid for a missing share or a malformed share id", async () => {
      const owner = await seedOwner();
      const project = await seedProject(owner);
      const invalid = { kind: "invalid", reason: "share" };

      expect(await shareProject(owner._id, project._id, undefined)).toEqual(invalid);
      expect(await unshareProject(owner._id, project._id, undefined)).toEqual(invalid);
      expect(
        await unshareProject(owner._id, project._id, {
          _id: { _bsontype: "ObjectId" } as never,
        }),
      ).toEqual(invalid);
    });

    it("unshares an owned project", async () => {
      const owner = await seedOwner();
      const project = await seedProject(owner);
      const shared = await shareProject(owner._id, project._id, { url: "cut" });
      if (shared.kind !== "ok") throw new Error("expected ok");

      const outcome = await unshareProject(owner._id, project._id, {
        _id: (shared.project.share as OwnerShare)._id,
      });

      expect(outcome.kind).toBe("ok");
      expect((await store().getProject(project._id))!.share).toBeNull();
      expect(await store().findShareByUrl("cut")).toBeNull();
    });
  });

  describe("removeProject", () => {
    const seedShared = async () => {
      const owner = await seedOwner();
      const project = await seedProject(owner);
      await shareProject(owner._id, project._id, { url: "cut" });
      return { owner, project };
    };

    const expectGone = async (
      owner: { _id: Id },
      project: { _id: Id; noteId: Id },
    ): Promise<void> => {
      expect(await store().getProject(project._id)).toBeNull();
      expect(await store().loadProject(project._id)).toBeNull();
      expect(await store().getNote(project.noteId)).toBeNull();
      expect(await store().listNotes(project._id)).toEqual([]);
      expect(await store().findShareByUrl("cut")).toBeNull();
      expect((await store().getUser(owner._id))!.projectIds).toEqual([]);
      expect(await store().ownedProjectIds(owner._id)).toEqual([]);
    };

    it("removes the notes, the share, the owner's ref and then the project", async () => {
      const { owner, project } = await seedShared();

      const outcome = await removeProject(owner._id, project._id);

      expect(outcome.kind).toBe("ok");
      if (outcome.kind === "ok") expect(outcome.project._id).toBe(project._id);
      await expectGone(owner, project);
    });

    it("frees the share url for another project", async () => {
      const { owner, project } = await seedShared();
      const next = await seedProject(owner, "Next");

      await removeProject(owner._id, project._id);

      expect((await shareProject(owner._id, next._id, { url: "cut" })).kind).toBe("ok");
    });

    it("reports notFound for a project the caller does not own and leaves it intact", async () => {
      const { project } = await seedShared();
      const other = await seedOwner("other@example.com");

      expect(await removeProject(other._id, project._id)).toEqual({ kind: "notFound" });
      expect(await store().getProject(project._id)).not.toBeNull();
      expect(await store().getNote(project.noteId)).not.toBeNull();
      expect(await store().findShareByUrl("cut")).toMatchObject({ projectId: project._id });
    });

    // The cascade stops after its Notes and Share are gone, before the list and the Project.
    const failAfterNotesAndShare = (s: Store) => {
      const { updateNote, removeDoneNotes, removeShare } = s;
      vi.spyOn(s, "removeProject").mockImplementationOnce(async (project: ProjectRecord) => {
        for (const note of await s.listNotes(project._id)) {
          await updateNote(note._id, { done: true });
        }
        await removeDoneNotes(project._id);
        await removeShare(project._id, project.share!._id);
        throw new Error("project store down");
      });
    };

    it("fails without deleting the project when a step fails, and a re-run completes", async () => {
      const { owner, project } = await seedShared();
      failAfterNotesAndShare(store());

      await expect(removeProject(owner._id, project._id)).rejects.toThrow("project store down");
      expect(await store().getProject(project._id)).not.toBeNull();
      expect(await store().getNote(project.noteId)).toBeNull();
      expect((await store().getUser(owner._id))!.projectIds).toEqual([project._id]);

      expect((await removeProject(owner._id, project._id)).kind).toBe("ok");
      await expectGone(owner, project);
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

      for (const removed of [a, b]) {
        expect(await store().getProject(removed._id)).toBeNull();
        expect(await store().getNote(removed.noteId)).toBeNull();
      }
      expect(await store().ownedProjectIds(owner._id)).toEqual([]);
      expect(await store().getProject(kept._id)).not.toBeNull();
      expect(await store().getNote(kept.noteId)).not.toBeNull();
      expect((await store().getUser(other._id))!.projectIds).toEqual([kept._id]);
    });
  });
});
