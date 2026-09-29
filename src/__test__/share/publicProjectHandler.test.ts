import type { NextApiRequest, NextApiResponse } from "next";
import { describe, expect, it, vi } from "vitest";

import handler from "@/api/public_project";
import { Note, Project, User } from "@/utils/mongoose";
import { attachOrUpdateShare } from "@/utils/share/shareIntake";

import { useTestJwtSecret } from "../api/http";
import { useTestDb } from "../db/testDb";

useTestDb();
useTestJwtSecret();

const post = async (body: Record<string, unknown>) => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  await handler({ body } as NextApiRequest, res as unknown as NextApiResponse);
  return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
};

const seedShare = async (password?: string) => {
  const owner = await User.create({ email: "owner@example.com", username: "owner" });
  const project = await Project.create({ title: "Rough cut", user: owner._id });
  const note = await Note.create({ content: "Trim", project: project._id, user: owner._id });
  project.notes.push(note._id);
  await project.save();
  await attachOrUpdateShare(project, { url: "rough-cut", password });
  return project;
};

describe("POST /api/public_project", () => {
  it("answers 401 for a protected Share without a password", async () => {
    await seedShare("hunter2");

    expect(await post({ shareUrl: "rough-cut" })).toEqual({
      status: 401,
      body: { msg: "shared project password required" },
    });
  });

  it("answers 403 for a wrong password", async () => {
    await seedShare("hunter2");

    expect(await post({ shareUrl: "rough-cut", password: "nope" })).toEqual({
      status: 403,
      body: { msg: "password incorrect" },
    });
  });

  it("answers 404 for an unknown share url", async () => {
    expect(await post({ shareUrl: "missing" })).toEqual({
      status: 404,
      body: { msg: "Share url does not exist." },
    });
  });

  it("answers 404 when the shared Project was deleted", async () => {
    const project = await seedShare();
    await Project.deleteOne({ _id: project._id });

    expect(await post({ shareUrl: "rough-cut" })).toEqual({
      status: 404,
      body: { msg: "Share url does not exist." },
    });
  });

  it("answers 200 with the public project in the user.projects shape", async () => {
    const project = await seedShare("hunter2");

    const { status, body } = await post({ shareUrl: "rough-cut", password: "hunter2" });

    expect(status).toBe(200);
    expect(body.user.projects).toEqual([
      expect.objectContaining({ _id: project._id.toString(), title: "Rough cut" }),
    ]);
    expect(body.user.projects[0].notes[0].user).toEqual({
      _id: project.user.toString(),
      username: "owner",
    });
    expect(body.shareToken).toEqual(expect.any(String));
    const wire = JSON.stringify(body);
    expect(wire).not.toContain("password");
    expect(wire).not.toContain("owner@example.com");
  });
});
