import { describe, expect, it } from "vitest";

import { mayEditViaShare, openSharedProject } from "@/utils/share/shareAccess";
import { attachOrUpdateShare } from "@/utils/share/shareIntake";
import type { Id } from "@/utils/store";

import { useTestJwtSecret } from "../api/http";
import { rawData } from "../db/rawData";
import { seedNote, seedProject, seedUser, sortById } from "../db/seed";
import { BACKENDS, useTestStore } from "../db/testStores";

useTestJwtSecret();

describe.each(BACKENDS)("Share access: %s", (backend) => {
  const store = useTestStore(backend);

  // The Project as the Note intake reads it, Share included.
  const record = async (project: { _id: Id }) => (await store().getProject(project._id))!;

  const seedSharedProject = async (share: { password?: string; canEdit?: boolean } = {}) => {
    const owner = await seedUser(store(), "owner@example.com", { username: "owner" });
    const project = await seedProject(store(), owner._id, { title: "Rough cut", src: "cut.mp4" });
    await seedNote(store(), project._id, {
      content: "Trim the intro",
      time: 12,
      authorId: owner._id,
    });
    await seedNote(store(), project._id, { content: "Louder", time: 30 });
    await attachOrUpdateShare(project, { url: "rough-cut", ...share });
    return { owner, project: await record(project) };
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
      await rawData().removeProjectOnly(project._id);

      expect(await openSharedProject("rough-cut", undefined)).toEqual({ kind: "notFound" });
    });

    it("returns notFound for a Share the Project no longer points at", async () => {
      const { project } = await seedSharedProject();
      await rawData().addStaleShareUrl(project._id, "stale");

      expect(await openSharedProject("stale", undefined)).toEqual({ kind: "notFound" });
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
      expect({ ...result.project, notes: sortById(result.project.notes) }).toEqual({
        _id: project._id,
        title: "Rough cut",
        src: "cut.mp4",
        share: { _id: project.share!._id, url: "rough-cut", canEdit: false },
        notes: [
          expect.objectContaining({
            content: "Trim the intro",
            time: 12,
            done: false,
            project: project._id,
            user: { _id: owner._id, username: "owner", role: "owner" },
          }),
          expect.objectContaining({ content: "Louder", time: 30 }),
        ],
      });
      expect(sortById(result.project.notes)[1]).not.toHaveProperty("user");
      const wire = JSON.stringify(result.project);
      expect(wire).not.toContain("password");
      expect(wire).not.toContain("owner@example.com");
    });

    it("shows a note author whose username is their email address by id and role only", async () => {
      const { project } = await seedSharedProject();
      const author = await seedUser(store(), "casey@example.com");
      const authored = await seedNote(store(), project._id, {
        content: "Casey's",
        authorId: author._id,
      });

      const result = await openSharedProject("rough-cut", undefined);

      if (result.kind !== "ok") throw new Error(`expected ok, got ${result.kind}`);
      expect(result.project.notes.find((note) => note._id === authored._id)?.user).toEqual({
        _id: author._id,
        role: "member",
      });
      expect(JSON.stringify(result.project)).not.toContain("casey@example.com");
    });

    it("labels the owner's notes owner, other signed-in authors member and guest notes with no author", async () => {
      const { owner, project } = await seedSharedProject();
      // Registration defaults the username to the email, which stays private.
      await store().updateProfile(owner._id, { username: "owner@example.com" });
      const member = await seedUser(store(), "member@example.com");
      await seedNote(store(), project._id, { content: "Grade", authorId: member._id });

      const result = await openSharedProject("rough-cut", undefined);

      if (result.kind !== "ok") throw new Error(`expected ok, got ${result.kind}`);
      expect(sortById(result.project.notes).map((note) => note.user)).toEqual([
        { _id: owner._id, role: "owner" },
        undefined,
        { _id: member._id, role: "member" },
      ]);
      expect(JSON.stringify(result.project)).not.toMatch(/@example\.com/);
    });
  });

  describe("mayEditViaShare", () => {
    it("allows edits when the Project's Share has canEdit", async () => {
      const { project } = await seedSharedProject({ canEdit: true });

      expect(await mayEditViaShare(await record(project), undefined)).toEqual({ kind: "allowed" });
    });

    it("asks for the password on a protected Share without a valid Share token", async () => {
      const { project } = await seedSharedProject({ canEdit: true, password: "hunter2" });
      const opened = await openSharedProject("rough-cut", "hunter2");
      if (opened.kind !== "ok") throw new Error(`expected ok, got ${opened.kind}`);

      expect(await mayEditViaShare(await record(project), undefined)).toEqual({
        kind: "passwordRequired",
      });
      expect(await mayEditViaShare(await record(project), "not-a-token")).toEqual({
        kind: "passwordRequired",
      });
      expect(await mayEditViaShare(await record(project), opened.shareToken)).toEqual({
        kind: "allowed",
      });
    });

    it("denies edits when the Project's Share has canEdit false", async () => {
      const { project } = await seedSharedProject({ canEdit: false });

      expect(await mayEditViaShare(await record(project), undefined)).toEqual({
        kind: "forbidden",
      });
    });

    it("denies edits when the Project has no Share", async () => {
      const owner = await seedUser(store(), "solo@example.com", { username: "solo" });
      const project = await seedProject(store(), owner._id, { title: "Private" });

      expect(await mayEditViaShare(await record(project), undefined)).toEqual({
        kind: "forbidden",
      });
    });
  });
});
