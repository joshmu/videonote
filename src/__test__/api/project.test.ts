import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { afterEach, describe, expect, it, vi } from "vitest";

import handler from "@/api/project";
import { ProjectApiActions } from "@/shared/types";
import { Note, Project, Share, User } from "@/utils/mongoose";

import { useTestDb } from "../db/testDb";
import { callApi, useTestJwtSecret } from "./http";

useTestDb();
useTestJwtSecret();

afterEach(() => {
  vi.restoreAllMocks();
});

const OWNER = "owner@example.com";
const OTHER = "other@example.com";

const seed = async () => {
  const owner = await User.create({ email: OWNER, username: "owner" });
  await User.create({ email: OTHER, username: "other" });
  const project = await Project.create({ title: "Rough cut", src: "a.mp4", user: owner._id });
  await User.updateOne({ _id: owner._id }, { $push: { projects: project._id } });
  return { owner, project };
};

describe("/api/project", () => {
  it("creates a project and replies 200 with it and a rotated token", async () => {
    await seed();

    const { status, body } = await callApi(
      handler,
      { action: ProjectApiActions.CREATE, project: { title: "New", src: "b.mp4" } },
      { email: OWNER },
    );

    expect(status).toBe(StatusCodes.OK);
    expect(body.project).toMatchObject({ title: "New", src: "b.mp4" });
    expect(body.token).toEqual(expect.any(String));
  });

  it.each([
    ProjectApiActions.GET,
    ProjectApiActions.UPDATE,
    ProjectApiActions.SHARE,
    ProjectApiActions.REMOVE_SHARE,
    ProjectApiActions.REMOVE,
  ])("replies 404 to %s on a project the caller does not own", async (action) => {
    const { project } = await seed();

    const { status, body } = await callApi(
      handler,
      {
        action,
        project: { _id: project._id.toString(), title: "Hijack" },
        share: { _id: new Types.ObjectId().toString(), url: "hijack" },
      },
      { email: OTHER },
    );

    expect(status).toBe(StatusCodes.NOT_FOUND);
    expect(body.msg).toEqual(expect.any(String));
    expect(await Project.findById(project._id)).toMatchObject({ title: "Rough cut" });
  });

  it("replies 404 when the project names no id", async () => {
    await seed();

    const { status } = await callApi(
      handler,
      { action: ProjectApiActions.GET, project: {} },
      { email: OWNER },
    );

    expect(status).toBe(StatusCodes.NOT_FOUND);
  });

  it.each([ProjectApiActions.GET, ProjectApiActions.CREATE, ProjectApiActions.REMOVE])(
    "replies 400 to %s without a project",
    async (action) => {
      await seed();

      const { status } = await callApi(handler, { action, project: null }, { email: OWNER });

      expect(status).toBe(StatusCodes.BAD_REQUEST);
    },
  );

  it.each([{}, { title: "" }, { title: "  " }, { title: 42 }])(
    "replies 400 to CREATE with %j",
    async (project) => {
      await seed();

      const { status } = await callApi(
        handler,
        { action: ProjectApiActions.CREATE, project },
        { email: OWNER },
      );

      expect(status).toBe(StatusCodes.BAD_REQUEST);
      expect(await Project.countDocuments()).toBe(1);
    },
  );

  it("replies 500 with only a message when the database fails", async () => {
    const { project } = await seed();
    vi.spyOn(Note, "deleteMany").mockRejectedValueOnce(new Error("note store down"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { status, body } = await callApi(
      handler,
      { action: ProjectApiActions.REMOVE, project: { _id: project._id.toString() } },
      { email: OWNER },
    );

    expect(status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(body).toEqual({ msg: "Database error" });
    expect(console.error).toHaveBeenCalled();
  });

  describe("owner projection", () => {
    const share = (projectId: string, fields: Record<string, unknown>) =>
      callApi(
        handler,
        {
          action: ProjectApiActions.SHARE,
          project: { _id: projectId },
          share: { url: "rough-cut", ...fields },
        },
        { email: OWNER },
      );

    it("replies to SHARE with hasPassword in place of the password hash", async () => {
      const { project } = await seed();

      const { status, body } = await share(project._id.toString(), { password: "hunter2" });

      expect(status).toBe(StatusCodes.OK);
      const stored = await Share.findOne({ url: "rough-cut" }).select("+password");
      expect(body.project.share).toEqual({
        _id: stored._id.toString(),
        url: "rough-cut",
        canEdit: true,
        hasPassword: true,
      });
      expect(JSON.stringify(body)).not.toContain(stored.password);
      expect(JSON.stringify(body)).not.toContain("password");
    });

    it("keeps, sets and removes the Share password from SHARE", async () => {
      const { project } = await seed();
      const id = project._id.toString();

      expect((await share(id, {})).body.project.share.hasPassword).toBe(false);
      expect((await share(id, { password: "hunter2" })).body.project.share.hasPassword).toBe(true);
      expect((await share(id, { canEdit: false })).body.project.share).toMatchObject({
        canEdit: false,
        hasPassword: true,
      });
      expect((await share(id, { password: "" })).body.project.share.hasPassword).toBe(false);
    });

    it("replies to GET with note authors as the public view", async () => {
      const { owner, project } = await seed();
      const other = await User.findOne({ email: OTHER });
      await User.updateOne({ _id: owner._id }, { username: OWNER });
      const own = await Note.create({ content: "Trim", project: project._id, user: owner._id });
      const theirs = await Note.create({ content: "Grade", project: project._id, user: other._id });
      const guests = await Note.create({ content: "Louder", project: project._id });
      await Project.updateOne(
        { _id: project._id },
        { $push: { notes: { $each: [own._id, theirs._id, guests._id] } } },
      );

      const { status, body } = await callApi(
        handler,
        { action: ProjectApiActions.GET, project: { _id: project._id.toString() } },
        { email: OWNER },
      );

      expect(status).toBe(StatusCodes.OK);
      expect(body.project.notes.map((note) => note.user)).toEqual([
        { _id: owner._id.toString(), role: "owner" },
        { _id: other._id.toString(), username: "other", role: "member" },
        undefined,
      ]);
      expect(JSON.stringify(body)).not.toMatch(/@example\.com/);
    });

    it("replies to REMOVE SHARE with no Share", async () => {
      const { project } = await seed();
      const { body: shared } = await share(project._id.toString(), { password: "hunter2" });

      const { status, body } = await callApi(
        handler,
        {
          action: ProjectApiActions.REMOVE_SHARE,
          project: { _id: project._id.toString() },
          share: { _id: shared.project.share._id },
        },
        { email: OWNER },
      );

      expect(status).toBe(StatusCodes.OK);
      expect(body.project.share).toBeNull();
    });
  });

  it("replies 409 when the share url is taken", async () => {
    const { owner, project } = await seed();
    const other = await Project.create({ title: "Other", user: owner._id });
    await Share.init();
    await Share.create({ url: "taken", user: owner._id, project: other._id });

    const { status, body } = await callApi(
      handler,
      {
        action: ProjectApiActions.SHARE,
        project: { _id: project._id.toString() },
        share: { url: "taken" },
      },
      { email: OWNER },
    );

    expect(status).toBe(StatusCodes.CONFLICT);
    expect(body.msg).toMatch(/taken/);
  });

  it("removes an owned project and replies with it", async () => {
    const { project } = await seed();

    const { status, body } = await callApi(
      handler,
      { action: ProjectApiActions.REMOVE, project: { _id: project._id.toString() } },
      { email: OWNER },
    );

    expect(status).toBe(StatusCodes.OK);
    expect(body.project._id).toBe(project._id.toString());
    expect(await Project.findById(project._id)).toBeNull();
  });

  it("replies 400 to an unknown action", async () => {
    await seed();

    const { status } = await callApi(handler, { action: "EXPLODE", project: {} }, { email: OWNER });

    expect(status).toBe(StatusCodes.BAD_REQUEST);
  });

  it.each([
    [ProjectApiActions.REMOVE_SHARE, undefined],
    [ProjectApiActions.REMOVE_SHARE, { _id: "not-an-id" }],
    [ProjectApiActions.SHARE, undefined],
  ])("replies 400 to %s with the share %j", async (action, share) => {
    const { project } = await seed();

    const { status, body } = await callApi(
      handler,
      { action, project: { _id: project._id.toString() }, share },
      { email: OWNER },
    );

    expect(status).toBe(StatusCodes.BAD_REQUEST);
    expect(body).toEqual({ msg: "Share not specified." });
  });
});
