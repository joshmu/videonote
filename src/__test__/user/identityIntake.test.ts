import bcrypt from "bcryptjs";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { authenticateToken } from "@/utils/jwt";
import { Note, Project, Settings, Share, User } from "@/utils/mongoose";
import { authenticate, register, removeAccount, updateProfile } from "@/utils/user/identityIntake";

import { useTestJwtSecret } from "../api/http";
import { useTestDb } from "../db/testDb";

useTestDb();
useTestJwtSecret();

beforeAll(async () => {
  await User.init();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const seedUser = async (email = "owner@example.com", password = "hunter2") =>
  User.create({ email, username: email, password: await bcrypt.hash(password, 4) });

describe("register", () => {
  it("stores a normalised email with a hashed password and returns a token for it", async () => {
    const outcome = await register({ email: "New@Example.com", password: "hunter2" });

    expect(outcome.kind).toBe("ok");
    if (outcome.kind !== "ok") return;
    const stored = await User.findOne({ email: "new@example.com" });
    expect(stored.username).toBe("new@example.com");
    expect(await bcrypt.compare("hunter2", stored.password)).toBe(true);
    expect(authenticateToken(outcome.token)).toBe("new@example.com");
  });

  it("reports emailTaken when the email is already registered", async () => {
    await seedUser("taken@example.com");

    expect(await register({ email: "Taken@example.com", password: "x" })).toEqual({
      kind: "emailTaken",
    });
    expect(await User.countDocuments()).toBe(1);
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
    expect(await User.countDocuments()).toBe(0);
  });
});

describe("authenticate", () => {
  it("returns the user and a token for matching credentials, normalising the email", async () => {
    const user = await seedUser();

    const outcome = await authenticate({ email: "Owner@Example.com", password: "hunter2" });

    expect(outcome.kind).toBe("ok");
    if (outcome.kind !== "ok") return;
    expect(outcome.user._id).toEqual(user._id);
    expect(authenticateToken(outcome.token)).toBe("owner@example.com");
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
    const before = user.toObject();

    const outcome = await updateProfile(user, {
      username: "Owner",
      email: "Renamed@Example.com",
      role: "paid",
      password: "overwritten",
      projects: ["64b000000000000000000000"],
      settings: "64b000000000000000000001",
    });

    expect(outcome.kind).toBe("ok");
    const stored = (await User.findById(user._id)).toObject();
    expect(stored).toMatchObject({ username: "Owner", email: "renamed@example.com" });
    expect(stored.role).toBe(before.role);
    expect(stored.password).toBe(before.password);
    expect(stored.projects).toEqual([]);
    expect(stored.settings).toBeUndefined();
  });

  it("returns a token minted for the new email", async () => {
    const user = await seedUser();

    const outcome = await updateProfile(user, { email: "renamed@example.com" });

    if (outcome.kind !== "ok") throw new Error(`expected ok, got ${outcome.kind}`);
    expect(authenticateToken(outcome.token)).toBe("renamed@example.com");
  });

  it("reports emailTaken for another user's email and leaves the profile unchanged", async () => {
    const user = await seedUser();
    await seedUser("taken@example.com");

    expect(await updateProfile(user, { username: "x", email: "Taken@example.com" })).toEqual({
      kind: "emailTaken",
    });
    expect((await User.findById(user._id)).toObject()).toMatchObject({
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
    const settings = await Settings.create({ user: user._id, playOffset: 1 });
    user.settings = settings._id;
    const project = await Project.create({ title: "Cut", user: user._id });
    const note = await Note.create({ content: "Trim", project: project._id, user: user._id });
    project.notes.push(note._id);
    await Share.create({ url: "cut", user: user._id, project: project._id });
    project.share = (await Share.findOne({ url: "cut" }))._id;
    await project.save();
    user.projects.push(project._id);
    await user.save();

    const other = await seedUser("other@example.com");
    const othersProject = await Project.create({ title: "Theirs", user: other._id });
    await Note.create({ content: "Mine on theirs", project: othersProject._id, user: user._id });
    const othersNote = await Note.create({ content: "Theirs", project: othersProject._id });
    return { user, other, othersProject, othersNote };
  };

  const expectOnlyOthersLeft = async ({ user, other, othersProject, othersNote }) => {
    expect(await User.findById(user._id)).toBeNull();
    expect(await Project.countDocuments({ user: user._id })).toBe(0);
    expect(await Note.countDocuments({ user: user._id })).toBe(0);
    expect(await Share.countDocuments({ user: user._id })).toBe(0);
    expect(await Settings.countDocuments({ user: user._id })).toBe(0);
    expect(await User.findById(other._id)).not.toBeNull();
    expect(await Project.findById(othersProject._id)).not.toBeNull();
    expect(await Note.findById(othersNote._id)).not.toBeNull();
  };

  it("removes the user's projects, notes, share and settings, then the user", async () => {
    const seeded = await seedAccount();

    expect(await removeAccount(seeded.user, "hunter2")).toEqual({ kind: "ok" });

    await expectOnlyOthersLeft(seeded);
  });

  it("reports wrongPassword and removes nothing", async () => {
    const { user } = await seedAccount();

    expect(await removeAccount(user, "wrong")).toEqual({ kind: "wrongPassword" });
    expect(await removeAccount(user, undefined)).toEqual({ kind: "wrongPassword" });
    expect(await Project.countDocuments({ user: user._id })).toBe(1);
    expect(await User.findById(user._id)).not.toBeNull();
  });

  it("fails without deleting the user when a step fails, and a re-run completes", async () => {
    const seeded = await seedAccount();
    vi.spyOn(Settings, "deleteMany").mockRejectedValueOnce(new Error("settings store down"));

    await expect(removeAccount(seeded.user, "hunter2")).rejects.toThrow("settings store down");
    expect(await User.findById(seeded.user._id)).not.toBeNull();

    expect(await removeAccount(seeded.user, "hunter2")).toEqual({ kind: "ok" });
    await expectOnlyOthersLeft(seeded);
  });
});
