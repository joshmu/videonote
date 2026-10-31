import { describe, expect, it } from "vitest";

import { newId } from "@/utils/store/dynamoStore";
import type { Store } from "@/utils/store/types";

import { BACKENDS, useTestStore } from "../db/testStores";

// The behaviour every Store must keep, run against DynamoDB Local.
describe.each(BACKENDS)("Store contract: %s", (backend) => {
  const store = useTestStore(backend);

  const seedUser = (s: Store, email = `${newId()}@example.com`, username = "someone") =>
    s.createUser({ email, username, passwordHash: "hash" }) as Promise<
      Exclude<Awaited<ReturnType<Store["createUser"]>>, "emailTaken">
    >;

  const seedProject = async (s: Store, ownerId: string, title = "Cut") =>
    s.createProject(ownerId, { title, src: "https://v.test/a.mp4" });

  const seedNote = (
    s: Store,
    projectId: string,
    fields: Partial<{ authorId: string; done: boolean; content: string }> = {},
  ) =>
    s.createNote({
      _id: newId(),
      projectId,
      content: fields.content ?? "Trim",
      time: 3,
      done: fields.done ?? false,
      ...(fields.authorId && { authorId: fields.authorId }),
    });

  describe("users", () => {
    it("creates a User found by id and by email, with no Projects or Settings", async () => {
      const s = store();
      const user = await seedUser(s, "a@example.com");

      expect(user).toMatchObject({
        email: "a@example.com",
        username: "someone",
        passwordHash: "hash",
        role: "free",
        projectIds: [],
        settings: null,
      });
      expect(user._id).toMatch(/^[0-9a-f]{24}$/);
      expect(await s.getUser(user._id)).toEqual(user);
      expect(await s.findUserByEmail("a@example.com")).toEqual(user);
    });

    it("records the day a User was seen without touching updatedAt", async () => {
      const s = store();
      const user = await seedUser(s, "seen@example.com");
      expect(user.lastSeenOn).toBeUndefined();

      await s.markSeen(user._id, "2026-10-31");

      const seen = await s.getUser(user._id);
      expect(seen?.lastSeenOn).toBe("2026-10-31");
      expect(seen?.updatedAt).toEqual(user.updatedAt);
    });

    it("doesn't bring back a removed User when marking them seen", async () => {
      const s = store();
      const user = await seedUser(s, "gone@example.com");
      await s.removeUser(user);

      await s.markSeen(user._id, "2026-10-31");

      expect(await s.getUser(user._id)).toBeNull();
    });

    it("finds nothing for an unknown or malformed id or email", async () => {
      const s = store();

      expect(await s.getUser(newId())).toBeNull();
      expect(await s.getUser("not-an-id")).toBeNull();
      expect(await s.findUserByEmail("nobody@example.com")).toBeNull();
    });

    it("takes an email once", async () => {
      const s = store();
      await seedUser(s, "taken@example.com");

      expect(
        await s.createUser({ email: "taken@example.com", username: "x", passwordHash: "h" }),
      ).toBe("emailTaken");
    });

    it("updates the username and moves the email, freeing the old one", async () => {
      const s = store();
      const user = await seedUser(s, "old@example.com");

      const updated = await s.updateProfile(user._id, {
        username: "renamed",
        email: "new@example.com",
      });

      expect(updated).toMatchObject({ username: "renamed", email: "new@example.com" });
      expect((await s.findUserByEmail("new@example.com"))?._id).toBe(user._id);
      expect(await s.findUserByEmail("old@example.com")).toBeNull();
      expect(await seedUser(s, "old@example.com")).toMatchObject({ email: "old@example.com" });
    });

    it("refuses an email another User has and keeps the profile", async () => {
      const s = store();
      await seedUser(s, "other@example.com");
      const user = await seedUser(s, "mine@example.com");

      expect(await s.updateProfile(user._id, { username: "x", email: "other@example.com" })).toBe(
        "emailTaken",
      );
      expect(await s.getUser(user._id)).toMatchObject({
        email: "mine@example.com",
        username: "someone",
      });
    });

    it("creates Settings on first save, with hints on, and merges later saves", async () => {
      const s = store();
      const user = await seedUser(s);
      const project = await seedProject(s, user._id);

      const first = await s.saveSettings(user._id, { currentProject: project._id, playOffset: 2 });
      expect(first).toMatchObject({ currentProject: project._id, playOffset: 2, showHints: true });

      const second = await s.saveSettings(user._id, { showHints: false, seekJump: 10 });
      expect(second).toMatchObject({
        _id: first._id,
        currentProject: project._id,
        playOffset: 2,
        showHints: false,
        seekJump: 10,
      });
      expect((await s.getUser(user._id))?.settings).toMatchObject({ _id: first._id, seekJump: 10 });
    });

    it("removes a User and frees their email", async () => {
      const s = store();
      const user = await seedUser(s, "gone@example.com");

      await s.removeUser(user);

      expect(await s.getUser(user._id)).toBeNull();
      expect(await s.findUserByEmail("gone@example.com")).toBeNull();
    });
  });

  describe("projects", () => {
    it("lists created Projects in order and reads them back", async () => {
      const s = store();
      const owner = await seedUser(s);

      const first = await seedProject(s, owner._id, "first");
      const second = await seedProject(s, owner._id, "second");

      expect(first).toMatchObject({
        ownerId: owner._id,
        title: "first",
        src: "https://v.test/a.mp4",
        share: null,
      });
      expect((await s.getUser(owner._id))?.projectIds).toEqual([first._id, second._id]);
      expect(await s.ownedProjectIds(owner._id)).toEqual([first._id, second._id]);
      expect(await s.getProject(first._id)).toEqual(first);
      expect(await s.getProject(newId())).toBeNull();
      expect(await s.getProject("nope")).toBeNull();
    });

    it("updates title and src", async () => {
      const s = store();
      const owner = await seedUser(s);
      const project = await seedProject(s, owner._id);

      const updated = await s.updateProject(project._id, {
        title: "Final",
        src: "https://v.test/b.mp4",
      });

      expect(updated).toMatchObject({ title: "Final", src: "https://v.test/b.mp4" });
      expect(await s.getProject(project._id)).toMatchObject({ title: "Final" });
      expect(await s.updateProject(newId(), { title: "x" })).toBeNull();
    });

    it("loads a Project with its Notes and their authors", async () => {
      const s = store();
      const owner = await seedUser(s, "owner@example.com", "owner");
      const member = await seedUser(s, "member@example.com", "member");
      const project = await seedProject(s, owner._id);
      const byOwner = await seedNote(s, project._id, { authorId: owner._id });
      const byMember = await seedNote(s, project._id, { authorId: member._id, content: "Louder" });
      const byGuest = await seedNote(s, project._id, { content: "Nice" });

      const view = await s.loadProject(project._id);

      expect(view).toMatchObject({ _id: project._id, title: "Cut" });
      const notes = Object.fromEntries(view!.notes.map((note) => [note._id, note]));
      expect(notes[byOwner._id].author).toEqual({
        _id: owner._id,
        username: "owner",
        email: "owner@example.com",
      });
      expect(notes[byMember._id]).toMatchObject({ content: "Louder", authorId: member._id });
      expect(notes[byGuest._id]).toMatchObject({ author: null });
      expect(notes[byGuest._id]).not.toHaveProperty("authorId");
    });

    it("reads a removed author's Notes as a guest's", async () => {
      const s = store();
      const owner = await seedUser(s);
      const member = await seedUser(s);
      const project = await seedProject(s, owner._id);
      const note = await seedNote(s, project._id, { authorId: member._id });

      await s.removeUser(member);

      const [loaded] = (await s.loadProject(project._id))!.notes;
      expect(loaded).toMatchObject({ _id: note._id, author: null });
      expect(loaded).not.toHaveProperty("authorId");
      expect(await s.loadNote(note._id)).toMatchObject({ author: null });
    });

    it("loads Projects in the order asked, skipping missing ones", async () => {
      const s = store();
      const owner = await seedUser(s);
      const a = await seedProject(s, owner._id, "a");
      const b = await seedProject(s, owner._id, "b");

      const views = await s.loadProjects([b._id, newId(), a._id]);

      expect(views.map((view) => view.title)).toEqual(["b", "a"]);
    });

    it("removes a Project with its Notes, its Share and its place in the list", async () => {
      const s = store();
      const owner = await seedUser(s);
      const keep = await seedProject(s, owner._id, "keep");
      const project = await seedProject(s, owner._id, "gone");
      const note = await seedNote(s, project._id, { authorId: owner._id });
      await s.putShare(project._id, { url: "gone-share" });

      await s.removeProject((await s.getProject(project._id))!);

      expect(await s.getProject(project._id)).toBeNull();
      expect(await s.getNote(note._id)).toBeNull();
      expect(await s.findShareByUrl("gone-share")).toBeNull();
      expect((await s.getUser(owner._id))?.projectIds).toEqual([keep._id]);
      // The url is free again.
      expect(await s.putShare(keep._id, { url: "gone-share" })).toMatchObject({
        url: "gone-share",
      });
    });

    it("finishes a removal when run again", async () => {
      const s = store();
      const owner = await seedUser(s);
      const project = await seedProject(s, owner._id);
      await seedNote(s, project._id);

      await s.removeProject(project);
      await s.removeProject(project);

      expect(await s.getProject(project._id)).toBeNull();
      expect((await s.getUser(owner._id))?.projectIds).toEqual([]);
    });
  });

  describe("shares", () => {
    it("creates a Share, open and editable by default, found by its url", async () => {
      const s = store();
      const owner = await seedUser(s);
      const project = await seedProject(s, owner._id);

      const share = await s.putShare(project._id, { url: "cut" });

      expect(share).toMatchObject({ url: "cut", canEdit: true, passwordHash: "" });
      expect((await s.getProject(project._id))?.share).toEqual(share);
      expect(await s.findShareByUrl("cut")).toEqual({ share, projectId: project._id });
      expect(await s.findShareByUrl("nope")).toBeNull();
    });

    it("updates a Share in place, moving its url and freeing the old one", async () => {
      const s = store();
      const owner = await seedUser(s);
      const project = await seedProject(s, owner._id);
      const created = await s.putShare(project._id, { url: "old", passwordHash: "h1" });
      if (created === "urlTaken") throw new Error("unexpected");

      const updated = await s.putShare(project._id, { url: "new", canEdit: false });

      expect(updated).toMatchObject({
        _id: created._id,
        url: "new",
        canEdit: false,
        passwordHash: "h1",
      });
      expect(await s.findShareByUrl("old")).toBeNull();
      expect((await s.findShareByUrl("new"))?.share._id).toBe(created._id);
      expect(await s.putShare(project._id, { passwordHash: "" })).toMatchObject({
        passwordHash: "",
      });
    });

    it("refuses a url another Share has, on create and on update", async () => {
      const s = store();
      const owner = await seedUser(s);
      const first = await seedProject(s, owner._id);
      const second = await seedProject(s, owner._id);
      await s.putShare(first._id, { url: "taken" });

      expect(await s.putShare(second._id, { url: "taken" })).toBe("urlTaken");
      expect((await s.getProject(second._id))?.share).toBeNull();

      await s.putShare(second._id, { url: "mine" });
      expect(await s.putShare(second._id, { url: "taken" })).toBe("urlTaken");
      expect((await s.getProject(second._id))?.share).toMatchObject({ url: "mine" });
    });

    it("removes a Share only by its own id, freeing its url", async () => {
      const s = store();
      const owner = await seedUser(s);
      const project = await seedProject(s, owner._id);
      const share = await s.putShare(project._id, { url: "cut" });
      if (share === "urlTaken") throw new Error("unexpected");

      await s.removeShare(project._id, newId());
      expect((await s.getProject(project._id))?.share?._id).toBe(share._id);

      await s.removeShare(project._id, share._id);
      expect((await s.getProject(project._id))?.share).toBeNull();
      expect(await s.findShareByUrl("cut")).toBeNull();

      const again = await s.putShare(project._id, { url: "cut" });
      expect(again).toMatchObject({ url: "cut" });
      expect(again).not.toMatchObject({ _id: share._id });
    });
  });

  describe("notes", () => {
    it("creates, reads, updates and lists Notes", async () => {
      const s = store();
      const owner = await seedUser(s);
      const project = await seedProject(s, owner._id);
      const _id = newId();

      const created = await s.createNote({
        _id,
        projectId: project._id,
        content: "Trim",
        time: 4,
        done: false,
        authorId: owner._id,
      });

      expect(created).toMatchObject({
        _id,
        projectId: project._id,
        content: "Trim",
        time: 4,
        done: false,
        authorId: owner._id,
      });
      expect(await s.getNote(_id)).toMatchObject({ _id, content: "Trim" });
      expect(await s.getNote(newId())).toBeNull();
      expect(await s.getNote("nope")).toBeNull();

      const updated = await s.updateNote(_id, { content: "Trim more", done: true });
      expect(updated).toMatchObject({ content: "Trim more", time: 4, done: true });
      expect(await s.loadNote(_id)).toMatchObject({
        content: "Trim more",
        author: { _id: owner._id },
      });
      expect((await s.listNotes(project._id)).map((note) => note._id)).toEqual([_id]);
    });

    it("removes only done Notes", async () => {
      const s = store();
      const owner = await seedUser(s);
      const project = await seedProject(s, owner._id);
      const keep = await seedNote(s, project._id);
      const done = await seedNote(s, project._id, { done: true });

      await s.removeDoneNotes(project._id);

      expect((await s.listNotes(project._id)).map((note) => note._id)).toEqual([keep._id]);
      expect(await s.getNote(done._id)).toBeNull();
      expect((await s.loadProject(project._id))?.notes.map((note) => note._id)).toEqual([keep._id]);
    });
  });
});
