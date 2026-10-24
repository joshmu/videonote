import { describe, expect, it } from "vitest";

import { attachOrUpdateShare, detachShare, ShareUrlTakenError } from "@/utils/share/shareIntake";
import { verifySharePassword } from "@/utils/share/sharePassword";
import type { ProjectRecord } from "@/utils/store";

import { seedNote, seedProject as seedBareProject, seedUser, testId } from "../db/seed";
import { BACKENDS, useTestStore } from "../db/testStores";

describe.each(BACKENDS)("Share intake: %s", (backend) => {
  const store = useTestStore(backend);

  const seedProject = async () => {
    const owner = await seedUser(store(), "owner@example.com", { username: "owner" });
    const project = await seedBareProject(store(), owner._id, { title: "Rough cut" });
    await seedNote(store(), project._id, {
      content: "Trim the intro",
      time: 12,
      authorId: owner._id,
    });
    return { owner, project };
  };

  const seedOther = (project: ProjectRecord) =>
    seedBareProject(store(), project.ownerId, { title: "Other" });

  const storedShare = async (url: string) => (await store().findShareByUrl(url))?.share;

  describe("against the database", () => {
    it("attaches a password-protected Share and returns the project with its relations", async () => {
      const { owner, project } = await seedProject();

      const shared = await attachOrUpdateShare(project, { url: "rough-cut", password: "hunter2" });

      const found = (await store().findShareByUrl("rough-cut"))!;
      expect(found.projectId).toBe(project._id);
      expect((await store().getProject(project._id))!.share).toEqual(found.share);
      expect(await verifySharePassword(found.share.passwordHash, "hunter2")).toEqual({
        kind: "ok",
      });

      expect(shared.share).toEqual({
        _id: found.share._id,
        url: "rough-cut",
        canEdit: true,
        hasPassword: true,
      });
      expect(shared.notes).toEqual([
        expect.objectContaining({
          content: "Trim the intro",
          user: { _id: owner._id, username: "owner", role: "owner" },
        }),
      ]);
      expect(JSON.stringify(shared)).not.toContain(found.share.passwordHash);
      expect(JSON.stringify(shared)).not.toContain("owner@example.com");
    });

    it("rejects a url another Share already uses and leaves the project unshared", async () => {
      const { project } = await seedProject();
      const other = await seedOther(project);
      await attachOrUpdateShare(other, { url: "taken" });

      await expect(attachOrUpdateShare(project, { url: "taken" })).rejects.toBeInstanceOf(
        ShareUrlTakenError,
      );

      expect((await store().getProject(project._id))!.share).toBeNull();
      expect(await store().findShareByUrl("taken")).toMatchObject({ projectId: other._id });
    });

    it("rejects updating the Share to a url another Share uses and keeps its url", async () => {
      const { project } = await seedProject();
      const other = await seedOther(project);
      await attachOrUpdateShare(other, { url: "taken" });
      await attachOrUpdateShare(project, { url: "rough-cut" });

      await expect(attachOrUpdateShare(project, { url: "taken" })).rejects.toBeInstanceOf(
        ShareUrlTakenError,
      );

      expect((await store().getProject(project._id))!.share?.url).toBe("rough-cut");
      expect(await store().findShareByUrl("rough-cut")).toMatchObject({ projectId: project._id });
      expect(await store().findShareByUrl("taken")).toMatchObject({ projectId: other._id });
    });

    it("detaches the Share, deleting it and clearing the project's reference", async () => {
      const { project } = await seedProject();
      const shared = await attachOrUpdateShare(project, { url: "rough-cut" });
      const shareId = (shared.share as { _id: string })._id;

      const detached = await detachShare(project, { _id: shareId });

      expect(detached.share).toBeNull();
      expect((await store().getProject(project._id))!.share).toBeNull();
      expect(await store().findShareByUrl("rough-cut")).toBeNull();
    });
  });

  describe("password handling", () => {
    it("stores no protection when the password is empty or omitted", async () => {
      const { project } = await seedProject();
      const other = await seedOther(project);

      await attachOrUpdateShare(project, { url: "empty", password: "" });
      await attachOrUpdateShare(other, { url: "omitted" });

      for (const url of ["empty", "omitted"]) {
        const stored = (await storedShare(url))!;
        expect(await verifySharePassword(stored.passwordHash, undefined)).toEqual({ kind: "open" });
      }
    });

    it("updates the attached Share in place, hashing a rotated password", async () => {
      const { project } = await seedProject();
      const first = await attachOrUpdateShare(project, { url: "rough-cut", password: "hunter2" });

      const updated = await attachOrUpdateShare(project, {
        url: "final-cut",
        canEdit: false,
        password: "rotated",
      });

      expect(await store().findShareByUrl("rough-cut")).toBeNull();
      const stored = (await storedShare("final-cut"))!;
      expect(stored._id).toBe((first.share as { _id: string })._id);
      expect(stored.canEdit).toBe(false);
      expect(await verifySharePassword(stored.passwordHash, "rotated")).toEqual({ kind: "ok" });
      expect(updated.share).toMatchObject({ _id: stored._id, url: "final-cut" });
    });

    it("keeps the existing password when an update omits it", async () => {
      const { project } = await seedProject();
      await attachOrUpdateShare(project, { url: "rough-cut", password: "hunter2" });

      const updated = await attachOrUpdateShare(project, { url: "rough-cut", canEdit: false });

      const stored = (await storedShare("rough-cut"))!;
      expect(await verifySharePassword(stored.passwordHash, "hunter2")).toEqual({ kind: "ok" });
      expect(updated.share).toMatchObject({ hasPassword: true });
    });

    it("removes the password when an update sends an empty one", async () => {
      const { project } = await seedProject();
      await attachOrUpdateShare(project, { url: "rough-cut", password: "hunter2" });

      const updated = await attachOrUpdateShare(project, { url: "rough-cut", password: "" });

      const stored = (await storedShare("rough-cut"))!;
      expect(await verifySharePassword(stored.passwordHash, undefined)).toEqual({ kind: "open" });
      expect(updated.share).toMatchObject({ hasPassword: false });
    });

    it("only detaches a Share that belongs to the project", async () => {
      const { project } = await seedProject();
      const other = await seedOther(project);
      const otherShared = await attachOrUpdateShare(other, { url: "other" });

      await detachShare(project, { _id: (otherShared.share as { _id: string })._id });

      expect(await store().findShareByUrl("other")).toMatchObject({ projectId: other._id });
      expect((await store().getProject(other._id))!.share).not.toBeNull();
    });
  });

  describe("writable fields", () => {
    const foreign = () => ({ _id: testId(), project: testId(), user: testId() });

    it("ignores _id, project and user from the caller on create", async () => {
      const { owner, project } = await seedProject();
      const injected = foreign();

      await attachOrUpdateShare(project, { url: "rough-cut", ...injected } as never);

      const found = (await store().findShareByUrl("rough-cut"))!;
      expect(found.share._id).not.toBe(injected._id);
      expect(found.projectId).toBe(project._id);
      expect(await store().getProject(injected.project)).toBeNull();
      expect((await store().getProject(project._id))!.ownerId).toBe(owner._id);
    });

    it("ignores _id, project and user from the caller on update", async () => {
      const { owner, project } = await seedProject();
      const shared = await attachOrUpdateShare(project, { url: "rough-cut" });

      await attachOrUpdateShare(project, {
        url: "final-cut",
        canEdit: false,
        ...foreign(),
      } as never);

      const found = (await store().findShareByUrl("final-cut"))!;
      expect(found.share).toMatchObject({
        _id: (shared.share as { _id: string })._id,
        url: "final-cut",
        canEdit: false,
      });
      expect(found.projectId).toBe(project._id);
      expect((await store().getProject(project._id))!.ownerId).toBe(owner._id);
    });
  });
});
