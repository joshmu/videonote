import bcrypt from "bcryptjs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { authenticateToken } from "@/utils/jwt";
import type { Id } from "@/utils/store";
import { authenticate, register, removeAccount, updateProfile } from "@/utils/user/identityIntake";

import { useTestJwtSecret } from "../api/http";
import { seedNote, seedProject, seedUser as seedAnyUser, testId } from "../db/seed";
import { BACKENDS, useTestStore } from "../db/testStores";

useTestJwtSecret();

afterEach(() => {
  vi.restoreAllMocks();
});

describe.each(BACKENDS)("Identity intake: %s", (backend) => {
  const store = useTestStore(backend);

  // The User as the auth wrappers hand it to an intake.
  const record = async (user: { _id: Id }) => (await store().getUser(user._id))!;

  const seedUser = (email = "owner@example.com", password = "hunter2") =>
    seedAnyUser(store(), email, { password });

  describe("register", () => {
    it("stores a normalised email with a hashed password and returns a token for it", async () => {
      const outcome = await register({ email: "New@Example.com", password: "hunter2" });

      expect(outcome.kind).toBe("ok");
      if (outcome.kind !== "ok") return;
      const stored = (await store().findUserByEmail("new@example.com"))!;
      expect(stored.username).toBe("new@example.com");
      expect(await bcrypt.compare("hunter2", stored.passwordHash)).toBe(true);
      expect(authenticateToken(outcome.token)).toBe(stored._id);
    });

    it("reports emailTaken when the email is already registered", async () => {
      const taken = await seedUser("taken@example.com");

      expect(await register({ email: "Taken@example.com", password: "x" })).toEqual({
        kind: "emailTaken",
      });
      expect(await store().findUserByEmail("taken@example.com")).toEqual(taken);
    });

    it.each([
      [{ password: "x" }, "missing"],
      [{ email: "a@example.com" }, "missing"],
      [{ email: "a@example.com", password: "" }, "missing"],
      [{ email: "not-an-email", password: "x" }, "email"],
      [{ email: { $ne: null }, password: "x" }, "missing"],
      [{ email: "a@example.com", password: { $ne: null } }, "missing"],
    ])("rejects %j as invalid (%s)", async (input, reason) => {
      expect(await register(input)).toEqual({ kind: "invalid", reason });
      expect(await store().findUserByEmail("a@example.com")).toBeNull();
      expect(await store().findUserByEmail("not-an-email")).toBeNull();
    });
  });

  describe("authenticate", () => {
    it("returns the user and a token for matching credentials, normalising the email", async () => {
      const user = await seedUser();

      const outcome = await authenticate({ email: "Owner@Example.com", password: "hunter2" });

      expect(outcome.kind).toBe("ok");
      if (outcome.kind !== "ok") return;
      expect(outcome.user._id).toBe(user._id);
      expect(authenticateToken(outcome.token)).toBe(user._id);
    });

    it("distinguishes an unknown email from a wrong password", async () => {
      await seedUser();

      expect(await authenticate({ email: "nobody@example.com", password: "x" })).toEqual({
        kind: "notFound",
      });
      expect(await authenticate({ email: "owner@example.com", password: "wrong" })).toEqual({
        kind: "wrongPassword",
      });
    });

    it("rejects missing or non-string credentials as invalid", async () => {
      await seedUser();

      expect(await authenticate({ password: "hunter2" })).toEqual({
        kind: "invalid",
        reason: "missing",
      });
      expect(await authenticate({ email: { $gt: "" }, password: "hunter2" })).toEqual({
        kind: "invalid",
        reason: "missing",
      });
      expect(await authenticate({ email: "owner@example.com", password: { $ne: 1 } })).toEqual({
        kind: "invalid",
        reason: "missing",
      });
    });
  });

  describe("updateProfile", () => {
    it("changes only username and email, ignoring every other field", async () => {
      const user = await seedUser();

      const outcome = await updateProfile(user, {
        username: "Owner",
        email: "Renamed@Example.com",
        role: "paid",
        password: "overwritten",
        projects: [testId()],
        settings: testId(),
      });

      expect(outcome.kind).toBe("ok");
      const stored = (await store().getUser(user._id))!;
      expect(stored).toMatchObject({ username: "Owner", email: "renamed@example.com" });
      expect(stored.role).toBe(user.role);
      expect(stored.passwordHash).toBe(user.passwordHash);
      expect(stored.projectIds).toEqual([]);
      expect(stored.settings).toBeNull();
    });

    it("returns a token for the same user after an email change", async () => {
      const user = await seedUser();

      const outcome = await updateProfile(user, { email: "renamed@example.com" });

      if (outcome.kind !== "ok") throw new Error(`expected ok, got ${outcome.kind}`);
      expect(authenticateToken(outcome.token)).toBe(user._id);
    });

    it("reports emailTaken for another user's email and leaves the profile unchanged", async () => {
      const user = await seedUser();
      await seedUser("taken@example.com");

      expect(await updateProfile(user, { username: "x", email: "Taken@example.com" })).toEqual({
        kind: "emailTaken",
      });
      expect(await store().getUser(user._id)).toMatchObject({
        email: "owner@example.com",
        username: "owner@example.com",
      });
    });

    it("rejects a malformed email as invalid", async () => {
      const user = await seedUser();

      expect(await updateProfile(user, { email: "nope" })).toEqual({
        kind: "invalid",
        reason: "email",
      });
    });
  });

  describe("removeAccount", () => {
    const seedAccount = async () => {
      const user = await seedUser();
      await store().saveSettings(user._id, { playOffset: 1 });
      const project = await seedProject(store(), user._id, { title: "Cut" });
      const second = await seedProject(store(), user._id, { title: "Second" });
      const note = await seedNote(store(), project._id, { content: "Trim", authorId: user._id });
      await store().putShare(project._id, { url: "cut" });

      const other = await seedUser("other@example.com");
      const othersProject = await seedProject(store(), other._id, { title: "Theirs" });
      const mineOnTheirs = await seedNote(store(), othersProject._id, {
        content: "Mine on theirs",
        authorId: user._id,
      });
      const othersNote = await seedNote(store(), othersProject._id, { content: "Theirs" });
      return {
        user: await record(user),
        project,
        second,
        note,
        other,
        othersProject,
        othersNote,
        mineOnTheirs,
      };
    };

    type Seeded = Awaited<ReturnType<typeof seedAccount>>;

    const expectOnlyOthersLeft = async (seeded: Seeded) => {
      const s = store();
      expect(await s.getUser(seeded.user._id)).toBeNull();
      expect(await s.findUserByEmail(seeded.user.email)).toBeNull();
      expect(await s.ownedProjectIds(seeded.user._id)).toEqual([]);
      expect(await s.getProject(seeded.project._id)).toBeNull();
      expect(await s.getProject(seeded.second._id)).toBeNull();
      expect(await s.getNote(seeded.note._id)).toBeNull();
      expect(await s.findShareByUrl("cut")).toBeNull();
      expect(await s.getUser(seeded.other._id)).not.toBeNull();
      const theirs = (await s.loadProject(seeded.othersProject._id))!;
      expect(theirs.notes.map((note) => note._id).sort()).toEqual(
        [seeded.mineOnTheirs._id, seeded.othersNote._id].sort(),
      );
      const kept = (await s.loadNote(seeded.mineOnTheirs._id))!;
      expect(kept.content).toBe("Mine on theirs");
      expect(kept.author).toBeNull();
      expect(kept).not.toHaveProperty("authorId");
    };

    // The email is free again: a new account can take it.
    const expectEmailFree = async (seeded: Seeded) => {
      expect((await register({ email: seeded.user.email, password: "again" })).kind).toBe("ok");
    };

    it("removes the user's projects, share and settings, keeps their notes on other owners' projects without an author, then removes the user", async () => {
      const seeded = await seedAccount();

      expect(await removeAccount(seeded.user, "hunter2")).toEqual({ kind: "ok" });

      await expectOnlyOthersLeft(seeded);
      await expectEmailFree(seeded);
    });

    it("keeps the user when removing the User fails after their projects are gone, and a re-run completes", async () => {
      const seeded = await seedAccount();
      vi.spyOn(store(), "removeUser").mockRejectedValueOnce(new Error("notes store down"));

      await expect(removeAccount(seeded.user, "hunter2")).rejects.toThrow("notes store down");
      expect(await store().getUser(seeded.user._id)).not.toBeNull();
      expect(await store().getProject(seeded.project._id)).toBeNull();

      expect(await removeAccount(await record(seeded.user), "hunter2")).toEqual({ kind: "ok" });
      await expectOnlyOthersLeft(seeded);
      await expectEmailFree(seeded);
    });

    it("reports wrongPassword and removes nothing", async () => {
      const { user, project } = await seedAccount();

      expect(await removeAccount(user, "wrong")).toEqual({ kind: "wrongPassword" });
      expect(await removeAccount(user, undefined)).toEqual({ kind: "wrongPassword" });
      expect(await store().ownedProjectIds(user._id)).toHaveLength(2);
      expect(await store().getProject(project._id)).not.toBeNull();
      expect(await store().getUser(user._id)).toEqual(user);
    });

    it("fails without deleting the user when the project cascade fails part-way, and a re-run completes", async () => {
      const seeded = await seedAccount();
      // The first Project goes; removing the second fails.
      const { removeProject } = store();
      vi.spyOn(store(), "removeProject")
        .mockImplementationOnce(removeProject)
        .mockRejectedValueOnce(new Error("project store down"));

      await expect(removeAccount(seeded.user, "hunter2")).rejects.toThrow("project store down");
      expect(await store().getUser(seeded.user._id)).not.toBeNull();
      expect(await store().ownedProjectIds(seeded.user._id)).toHaveLength(1);

      expect(await removeAccount(await record(seeded.user), "hunter2")).toEqual({ kind: "ok" });
      await expectOnlyOthersLeft(seeded);
    });
  });
});
