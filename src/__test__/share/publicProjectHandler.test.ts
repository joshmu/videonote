import type { NextApiRequest, NextApiResponse } from "next";
import { describe, expect, it, vi } from "vitest";

import handler from "@/api/public_project";
import { attachOrUpdateShare } from "@/utils/share/shareIntake";

import { useTestJwtSecret } from "../api/http";
import { rawData } from "../db/rawData";
import { seedNote, seedProject, seedUser } from "../db/seed";
import { BACKENDS, useTestStore } from "../db/testStores";

useTestJwtSecret();

const post = async (body: Record<string, unknown>) => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  await handler({ body } as NextApiRequest, res as unknown as NextApiResponse);
  return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
};

describe.each(BACKENDS)("POST /api/public_project: %s", (backend) => {
  const store = useTestStore(backend);

  const seedShare = async (password?: string) => {
    const owner = await seedUser(store(), "owner@example.com", { username: "owner" });
    const project = await seedProject(store(), owner._id, { title: "Rough cut" });
    await seedNote(store(), project._id, { content: "Trim", authorId: owner._id });
    await attachOrUpdateShare(project, { url: "rough-cut", password });
    return project;
  };

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
    await rawData().removeProjectOnly(project._id);

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
      expect.objectContaining({ _id: project._id, title: "Rough cut" }),
    ]);
    expect(body.user.projects[0].notes[0].user).toEqual({
      _id: project.ownerId,
      username: "owner",
      role: "owner",
    });
    expect(body.shareToken).toEqual(expect.any(String));
    const wire = JSON.stringify(body);
    expect(wire).not.toContain("password");
    expect(wire).not.toContain("owner@example.com");
  });
});
