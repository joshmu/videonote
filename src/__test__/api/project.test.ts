import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { describe, expect, it } from "vitest";

import handler from "@/api/project";
import { ProjectApiActions } from "@/shared/types";
import { Project, Share, User } from "@/utils/mongoose";

import { useTestDb } from "../db/testDb";
import { callApi, useTestJwtSecret } from "./http";

useTestDb();
useTestJwtSecret();

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

  it("replies 404 when the request names no project", async () => {
    await seed();

    const { status } = await callApi(handler, { action: ProjectApiActions.GET }, { email: OWNER });

    expect(status).toBe(StatusCodes.NOT_FOUND);
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
});
