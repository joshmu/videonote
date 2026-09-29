import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import authHandler from "@/api/auth";
import loginHandler from "@/api/login";
import registerHandler from "@/api/register";
import userHandler from "@/api/user";
import { authenticateToken } from "@/utils/jwt";
import { Note, Project, Settings, Share, User } from "@/utils/mongoose";

import { useTestDb } from "../db/testDb";
import { callApi, useTestJwtSecret } from "./http";

useTestDb();
useTestJwtSecret();

beforeAll(async () => {
  await User.init();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const EMAIL = "owner@example.com";

const seedUser = async (email = EMAIL) =>
  User.create({ email, username: email, password: await bcrypt.hash("hunter2", 4) });

describe("/api/register", () => {
  it("replies 201 with a token for a new account", async () => {
    const { status, body } = await callApi(registerHandler, { email: EMAIL, password: "hunter2" });

    expect(status).toBe(StatusCodes.CREATED);
    expect(authenticateToken(body.token)).toBe(EMAIL);
    expect(body.user.password).toBeUndefined();
  });

  it("replies 409 for an email that is already registered", async () => {
    await seedUser();

    const { status } = await callApi(registerHandler, { email: EMAIL, password: "x" });

    expect(status).toBe(StatusCodes.CONFLICT);
  });

  it.each([{}, { password: "x" }, { email: EMAIL }, { email: "nope", password: "x" }])(
    "replies 400 to %j",
    async (body) => {
      expect((await callApi(registerHandler, body)).status).toBe(StatusCodes.BAD_REQUEST);
    },
  );
});

describe("/api/login", () => {
  it("replies 302 with a token and the user without its password", async () => {
    await seedUser();

    const { status, body } = await callApi(loginHandler, { email: EMAIL, password: "hunter2" });

    expect(status).toBe(StatusCodes.MOVED_TEMPORARILY);
    expect(authenticateToken(body.token)).toBe(EMAIL);
    expect(body.user.email).toBe(EMAIL);
    expect(body.user.password).toBeUndefined();
    expect(body.user.createdAt).toBeUndefined();
    expect(body.user.updatedAt).toBeUndefined();
  });

  it("replies 404 for an unknown email and 401 for a wrong password", async () => {
    await seedUser();

    expect((await callApi(loginHandler, { email: "x@example.com", password: "a" })).status).toBe(
      StatusCodes.NOT_FOUND,
    );
    expect((await callApi(loginHandler, { email: EMAIL, password: "wrong" })).status).toBe(
      StatusCodes.UNAUTHORIZED,
    );
  });

  it.each([{}, { password: "hunter2" }, { email: EMAIL }, { email: { $ne: null }, password: "a" }])(
    "replies 400 to %j",
    async (body) => {
      await seedUser();
      expect((await callApi(loginHandler, body)).status).toBe(StatusCodes.BAD_REQUEST);
    },
  );
});

describe("/api/user", () => {
  it("updates the profile and replies with a token for the new email", async () => {
    await seedUser();

    const { status, body } = await callApi(
      userHandler,
      { action: "update", user: { username: "Owner", email: "new@example.com", role: "paid" } },
      { email: EMAIL },
    );

    expect(status).toBe(StatusCodes.OK);
    expect(body.user).toMatchObject({ username: "Owner", email: "new@example.com", role: "free" });
    expect(body.user.password).toBeUndefined();
    expect(authenticateToken(body.token)).toBe("new@example.com");
  });

  it("does not write settings", async () => {
    await seedUser();

    const { status } = await callApi(
      userHandler,
      { action: "update", user: { settings: { playOffset: 9 } } },
      { email: EMAIL },
    );

    expect(status).toBe(StatusCodes.OK);
    expect(await Settings.countDocuments()).toBe(0);
    expect((await User.findOne({ email: EMAIL })).settings).toBeUndefined();
  });

  it("replies 409 when the new email belongs to another user", async () => {
    await seedUser();
    await seedUser("taken@example.com");

    const { status } = await callApi(
      userHandler,
      { action: "update", user: { email: "taken@example.com" } },
      { email: EMAIL },
    );

    expect(status).toBe(StatusCodes.CONFLICT);
  });

  it("replies 400 to a malformed email", async () => {
    await seedUser();

    const { status } = await callApi(
      userHandler,
      { action: "update", user: { email: "nope" } },
      { email: EMAIL },
    );

    expect(status).toBe(StatusCodes.BAD_REQUEST);
  });

  it.each([undefined, "explode"])("replies 400 to action %s", async (action) => {
    await seedUser();

    const { status } = await callApi(userHandler, { action, user: {} }, { email: EMAIL });

    expect(status).toBe(StatusCodes.BAD_REQUEST);
  });

  it("removes the account and its data", async () => {
    const user = await seedUser();
    const project = await Project.create({ title: "Cut", user: user._id });
    await Note.create({ content: "Trim", project: project._id, user: user._id });

    const { status } = await callApi(
      userHandler,
      { action: "remove", user: { password: "hunter2" } },
      { email: EMAIL },
    );

    expect(status).toBe(StatusCodes.OK);
    expect(await User.countDocuments()).toBe(0);
    expect(await Project.countDocuments()).toBe(0);
    expect(await Note.countDocuments()).toBe(0);
  });

  it("replies 401 to a wrong password on remove", async () => {
    await seedUser();

    const { status } = await callApi(
      userHandler,
      { action: "remove", user: { password: "wrong" } },
      { email: EMAIL },
    );

    expect(status).toBe(StatusCodes.UNAUTHORIZED);
    expect(await User.countDocuments()).toBe(1);
  });

  it("replies 500, not 200, when removal fails part-way", async () => {
    const user = await seedUser();
    await Project.create({ title: "Cut", user: user._id });
    vi.spyOn(Share, "deleteMany").mockRejectedValueOnce(new Error("share store down"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { status } = await callApi(
      userHandler,
      { action: "remove", user: { password: "hunter2" } },
      { email: EMAIL },
    );

    expect(status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(await User.countDocuments()).toBe(1);
  });
});

describe("/api/auth", () => {
  it("replies with the user, settings and each project with its relations", async () => {
    const user = await seedUser();
    const settings = await Settings.create({ user: user._id, playOffset: 2 });
    const project = await Project.create({ title: "Cut", user: user._id });
    const note = await Note.create({ content: "Trim", project: project._id, user: user._id });
    const share = await Share.create({ url: "cut", user: user._id, project: project._id });
    project.notes.push(note._id);
    project.share = share._id;
    await project.save();
    user.settings = settings._id;
    user.projects.push(project._id);
    await user.save();

    const { status, body } = await callApi(authHandler, {}, { email: EMAIL });

    expect(status).toBe(StatusCodes.OK);
    expect(body.user.password).toBeUndefined();
    expect(body.user.settings).toMatchObject({ playOffset: 2 });
    expect(body.user.projects).toEqual([
      expect.objectContaining({
        title: "Cut",
        share: expect.objectContaining({ url: "cut" }),
        notes: [
          expect.objectContaining({
            content: "Trim",
            user: { _id: user._id.toString(), username: EMAIL, email: EMAIL },
          }),
        ],
      }),
    ]);
  });
});
