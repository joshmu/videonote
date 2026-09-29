import { Types } from "mongoose";
import type { NextApiRequest, NextApiResponse } from "next";
import { beforeAll, describe, expect, it, vi } from "vitest";

import handler from "@/api/note";
import { NoteApiAction } from "@/shared/types";
import { generateAccessToken } from "@/utils/jwt";
import { Note, Project, User } from "@/utils/mongoose";
import { attachOrUpdateShare } from "@/utils/share/shareIntake";

import { useTestDb } from "../db/testDb";

useTestDb();

beforeAll(() => {
  vi.stubEnv("JWT_TOKEN_SECRET", "test-secret");
});

const post = async (body: Record<string, unknown>, email?: string) => {
  const headers = email ? { authorization: `Bearer ${generateAccessToken(email)}` } : {};
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  await handler({ headers, body } as NextApiRequest, res as unknown as NextApiResponse);
  return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
};

const seed = async (share?: { canEdit: boolean }) => {
  const owner = await User.create({ email: "owner@example.com", username: "owner" });
  await User.create({ email: "visitor@example.com", username: "visitor" });
  const project = await Project.create({ title: "Rough cut", user: owner._id });
  if (share) await attachOrUpdateShare(project, { url: "rough-cut", ...share });
  return project._id.toString();
};

const note = (projectId: string) => ({
  _id: new Types.ObjectId().toString(),
  content: "Trim",
  time: 1,
  project: projectId,
});

describe("POST /api/note", () => {
  it("answers 200 with the note for the owner", async () => {
    const projectId = await seed();

    const { status, body } = await post({ note: note(projectId) }, "owner@example.com");

    expect(status).toBe(200);
    expect(body.note).toMatchObject({ content: "Trim" });
    expect(body.token).toEqual(expect.any(String));
  });

  it("answers 403 to another user without an editable Share", async () => {
    const projectId = await seed({ canEdit: false });

    expect((await post({ note: note(projectId) }, "visitor@example.com")).status).toBe(403);
    expect(
      (await post({ action: NoteApiAction.REMOVE_DONE_NOTES, projectId }, "visitor@example.com"))
        .status,
    ).toBe(403);
    expect(await Note.countDocuments()).toBe(0);
  });

  it("answers 403 to a guest without a Share", async () => {
    const projectId = await seed();

    expect((await post({ note: note(projectId) })).status).toBe(403);
    expect((await post({ action: NoteApiAction.REMOVE_DONE_NOTES, projectId })).status).toBe(403);
  });

  it("answers 200 to a guest through an editable Share", async () => {
    const projectId = await seed({ canEdit: true });

    expect((await post({ note: note(projectId) })).status).toBe(200);
    const removed = await post({ action: NoteApiAction.REMOVE_DONE_NOTES, projectId });
    expect(removed).toMatchObject({ status: 200, body: { notes: [expect.anything()] } });
  });

  it("never returns the author's email to a guest editing through a Share", async () => {
    const projectId = await seed({ canEdit: true });
    const owner = await User.findOne({ email: "owner@example.com" });
    const authored = await Note.create({ content: "Trim", project: projectId, user: owner._id });
    await Project.updateOne({ _id: projectId }, { $push: { notes: authored._id } });

    const { status, body } = await post({
      note: { ...note(projectId), _id: authored._id.toString(), content: "Tighter" },
    });

    expect(status).toBe(200);
    expect(body.note.user).toEqual({ _id: owner._id.toString(), username: "owner" });
    expect(JSON.stringify(body)).not.toContain("owner@example.com");
  });

  it("returns the author id, without the email, to an owner whose username is their email", async () => {
    const owner = await User.create({ email: "solo@example.com", username: "solo@example.com" });
    const project = await Project.create({ title: "Solo", user: owner._id });
    const own = await Note.create({ content: "Mine", project: project._id, user: owner._id });

    const { status, body } = await post(
      { note: { ...note(project._id.toString()), _id: own._id.toString(), content: "Edited" } },
      "solo@example.com",
    );

    expect(status).toBe(200);
    expect(body.note.user).toEqual({ _id: owner._id.toString() });
    expect(JSON.stringify(body.note)).not.toContain("solo@example.com");
  });

  it("answers 404 for a missing Project", async () => {
    await seed();

    const missing = new Types.ObjectId().toString();
    expect((await post({ note: note(missing) }, "owner@example.com")).status).toBe(404);
    expect(
      (
        await post(
          { action: NoteApiAction.REMOVE_DONE_NOTES, projectId: missing },
          "owner@example.com",
        )
      ).status,
    ).toBe(404);
  });

  it("answers 500 with only a msg when the write fails", async () => {
    const projectId = await seed();
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await post({ note: { ...note(projectId), _id: "not-an-object-id" } });

    expect(result).toEqual({ status: 500, body: { msg: "Database error" } });
  });

  it("answers 400 when no note is sent", async () => {
    expect((await post({})).status).toBe(400);
  });
});
