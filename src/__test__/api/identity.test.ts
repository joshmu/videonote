import { StatusCodes } from "http-status-codes";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import authHandler from "@/api/auth";
import loginHandler from "@/api/login";
import registerHandler from "@/api/register";
import userHandler from "@/api/user";
import { authenticateToken } from "@/utils/jwt";
import { hashSharePassword } from "@/utils/share/sharePassword";

import { rawData } from "../db/rawData";
import { seedNote, seedProject, seedUser as seedAnyUser, sortById } from "../db/seed";
import { BACKENDS, useTestStore } from "../db/testStores";
import { callApi, useTestJwtSecret } from "./http";

useTestJwtSecret();

afterEach(() => {
  vi.restoreAllMocks();
});

const EMAIL = "owner@example.com";

describe.each(BACKENDS)("identity routes: %s", (backend) => {
  const store = useTestStore(backend);

  const seedUser = (email = EMAIL) => seedAnyUser(store(), email, { password: "hunter2" });

  describe("/api/register", () => {
    it("replies 201 with a token for a new account", async () => {
      const { status, body } = await callApi(registerHandler, {
        email: EMAIL,
        password: "hunter2",
      });

      expect(status).toBe(StatusCodes.CREATED);
      expect(authenticateToken(body.token)).toBe(body.user._id);
      expect(body.user.password).toBeUndefined();
    });

    describe("with Turnstile on", () => {
      const siteverify = (reply: () => Promise<unknown>) =>
        vi.stubGlobal(
          "fetch",
          vi.fn(async () => ({ json: reply })),
        );

      beforeEach(() => {
        process.env.TURNSTILE_SECRET_KEY = "test-secret";
      });

      afterEach(() => {
        delete process.env.TURNSTILE_SECRET_KEY;
        vi.unstubAllGlobals();
      });

      it("refuses a signup with no token and creates nothing", async () => {
        siteverify(async () => ({ success: true }));

        const { status } = await callApi(registerHandler, { email: EMAIL, password: "hunter2" });

        expect(status).toBe(StatusCodes.FORBIDDEN);
        expect(fetch).not.toHaveBeenCalled();
        expect(await store().findUserByEmail(EMAIL)).toBeNull();
      });

      it("refuses a token Cloudflare rejects", async () => {
        siteverify(async () => ({ success: false }));

        const { status } = await callApi(registerHandler, {
          email: EMAIL,
          password: "hunter2",
          turnstileToken: "forged",
        });

        expect(status).toBe(StatusCodes.FORBIDDEN);
      });

      it("creates the account for a token Cloudflare accepts", async () => {
        siteverify(async () => ({ success: true }));

        const { status } = await callApi(registerHandler, {
          email: EMAIL,
          password: "hunter2",
          turnstileToken: "good",
        });

        expect(status).toBe(StatusCodes.CREATED);
      });

      it("lets the signup through when Cloudflare can't answer", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        siteverify(async () => {
          throw new Error("not json");
        });

        const { status } = await callApi(registerHandler, {
          email: EMAIL,
          password: "hunter2",
          turnstileToken: "good",
        });

        expect(status).toBe(StatusCodes.CREATED);
      });
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
      expect(authenticateToken(body.token)).toBe(body.user._id);
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

    it.each([
      {},
      { password: "hunter2" },
      { email: EMAIL },
      { email: { $ne: null }, password: "a" },
    ])("replies 400 to %j", async (body) => {
      await seedUser();
      expect((await callApi(loginHandler, body)).status).toBe(StatusCodes.BAD_REQUEST);
    });
  });

  describe("/api/user", () => {
    it("updates the profile and replies with a token for the new email", async () => {
      const user = await seedUser();
      await store().saveSettings(user._id, { playOffset: 1 });

      const { status, body } = await callApi(
        userHandler,
        { action: "update", user: { username: "Owner", email: "new@example.com", role: "paid" } },
        { email: EMAIL },
      );

      expect(status).toBe(StatusCodes.OK);
      expect(body.user).toMatchObject({
        username: "Owner",
        email: "new@example.com",
        role: "free",
      });
      expect(body.user.password).toBeUndefined();
      expect(body.user.settings).toBeUndefined();
      expect(authenticateToken(body.token)).toBe(body.user._id);
    });

    it("does not write settings", async () => {
      const user = await seedUser();

      const { status } = await callApi(
        userHandler,
        { action: "update", user: { settings: { playOffset: 9 } } },
        { email: EMAIL },
      );

      expect(status).toBe(StatusCodes.OK);
      expect((await store().getUser(user._id))!.settings).toBeNull();
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
      const project = await seedProject(store(), user._id, { title: "Cut" });
      const note = await seedNote(store(), project._id, { content: "Trim", authorId: user._id });

      const { status } = await callApi(
        userHandler,
        { action: "remove", user: { password: "hunter2" } },
        { email: EMAIL },
      );

      expect(status).toBe(StatusCodes.OK);
      expect(await store().getUser(user._id)).toBeNull();
      expect(await store().findUserByEmail(EMAIL)).toBeNull();
      expect(await store().getProject(project._id)).toBeNull();
      expect(await store().getNote(note._id)).toBeNull();
    });

    it("replies 401 to a wrong password on remove", async () => {
      const user = await seedUser();

      const { status } = await callApi(
        userHandler,
        { action: "remove", user: { password: "wrong" } },
        { email: EMAIL },
      );

      expect(status).toBe(StatusCodes.UNAUTHORIZED);
      expect(await store().getUser(user._id)).not.toBeNull();
    });

    it("replies 500, not 200, when removal fails part-way", async () => {
      const user = await seedUser();
      await seedProject(store(), user._id, { title: "Cut" });
      vi.spyOn(store(), "removeProject").mockRejectedValueOnce(new Error("project store down"));
      vi.spyOn(console, "error").mockImplementation(() => undefined);

      const { status } = await callApi(
        userHandler,
        { action: "remove", user: { password: "hunter2" } },
        { email: EMAIL },
      );

      expect(status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(await store().getUser(user._id)).not.toBeNull();
    });
  });

  describe("/api/auth", () => {
    it("replies with the user, settings and each project in the owner projection", async () => {
      const user = await seedUser();
      const member = await seedUser("member@example.com");
      await store().saveSettings(user._id, { playOffset: 2 });
      const project = await seedProject(store(), user._id, { title: "Cut" });
      await seedNote(store(), project._id, { content: "Trim", authorId: user._id });
      await seedNote(store(), project._id, { content: "Grade", authorId: member._id });
      await seedNote(store(), project._id, { content: "Louder" });
      const hash = await hashSharePassword("letmein");
      const share = await store().putShare(project._id, { url: "cut", passwordHash: hash });
      if (share === "urlTaken") throw new Error("expected a Share");

      const { status, body } = await callApi(authHandler, {}, { email: EMAIL });

      expect(status).toBe(StatusCodes.OK);
      expect(body.user.password).toBeUndefined();
      expect(body.user.settings).toMatchObject({ playOffset: 2 });
      expect(body.user.projects).toEqual([
        expect.objectContaining({
          title: "Cut",
          share: { _id: share._id, url: "cut", canEdit: true, hasPassword: true },
        }),
      ]);
      expect(sortById(body.user.projects[0].notes)).toEqual([
        expect.objectContaining({
          content: "Trim",
          user: { _id: user._id, role: "owner" },
        }),
        expect.objectContaining({
          content: "Grade",
          user: { _id: member._id, role: "member" },
        }),
        expect.not.objectContaining({ user: expect.anything() }),
      ]);
      const wire = JSON.stringify(body.user.projects);
      expect(wire).not.toContain(hash);
      expect(wire).not.toContain("password");
      expect(wire).not.toMatch(/@example\.com/);
    });

    it("loads the user's projects in one Store call, in the user's order, skipping projects they do not own", async () => {
      const user = await seedUser();
      const other = await seedUser("other@example.com");
      const foreign = await seedProject(store(), other._id, { title: "Theirs" });
      const later = await seedProject(store(), user._id, { title: "Later" });
      const earlier = await seedProject(store(), user._id, { title: "Earlier" });
      // A list out of creation order that names another owner's Project, as legacy data can.
      await rawData().listProjects(user._id, [earlier._id, foreign._id, later._id]);
      const loadProjects = vi.spyOn(store(), "loadProjects");
      const loadProject = vi.spyOn(store(), "loadProject");
      const getProject = vi.spyOn(store(), "getProject");

      const { status, body } = await callApi(authHandler, {}, { email: EMAIL });

      expect(status).toBe(StatusCodes.OK);
      expect(body.user.projects.map((project) => project.title)).toEqual(["Earlier", "Later"]);
      expect(loadProjects).toHaveBeenCalledTimes(1);
      expect(loadProject).not.toHaveBeenCalled();
      expect(getProject).not.toHaveBeenCalled();
    });
  });
});
