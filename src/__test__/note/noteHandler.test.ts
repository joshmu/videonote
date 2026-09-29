import { Types } from "mongoose";
import type { NextApiRequest, NextApiResponse } from "next";
import { beforeAll, describe, expect, it, vi } from "vitest";

import handler from "@/api/note";
import publicProject from "@/api/public_project";
import { NoteApiAction } from "@/shared/types";
import { Note, Project, Share, User } from "@/utils/mongoose";
import { attachOrUpdateShare, detachShare } from "@/utils/share/shareIntake";

import { callApi, tokenFor } from "../api/http";
import { useTestDb } from "../db/testDb";

useTestDb();

beforeAll(() => {
  vi.stubEnv("JWT_TOKEN_SECRET", "test-secret");
});

const post = async (body: Record<string, unknown>, email?: string, shareToken?: string) => {
  const headers: Record<string, string> = {};
  if (email) headers.authorization = `Bearer ${await tokenFor(email)}`;
  if (shareToken) headers["x-share-token"] = shareToken;
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  await handler({ headers, body } as NextApiRequest, res as unknown as NextApiResponse);
  return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
};

const seed = async (share?: { canEdit: boolean; password?: string }) => {
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
    expect(body.note.user).toEqual({ _id: owner._id.toString(), username: "owner", role: "owner" });
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
    expect(body.note.user).toEqual({ _id: owner._id.toString(), role: "owner" });
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

  it("answers 400 for a malformed note id or project id", async () => {
    const projectId = await seed();

    const malformedNote = await post(
      { note: { ...note(projectId), _id: "not-an-object-id" } },
      "owner@example.com",
    );
    const malformedProject = await post(
      { action: NoteApiAction.REMOVE_DONE_NOTES, projectId: "not-an-object-id" },
      "owner@example.com",
    );

    const bsonLookalike = await post(
      {
        action: NoteApiAction.REMOVE_DONE_NOTES,
        projectId: { _bsontype: "ObjectId", $ne: null },
      },
      "owner@example.com",
    );

    for (const result of [malformedNote, malformedProject, bsonLookalike]) {
      expect(result).toEqual({ status: 400, body: { msg: "Invalid note." } });
    }
  });

  it("answers 400 for a note without content", async () => {
    const projectId = await seed();

    const { status } = await post(
      { note: { ...note(projectId), content: undefined } },
      "owner@example.com",
    );

    expect(status).toBe(400);
    expect(await Note.countDocuments()).toBe(0);
  });

  it("answers 500 with only a msg when the write fails", async () => {
    const projectId = await seed();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Note, "create").mockRejectedValueOnce(new Error("write failed"));

    const result = await post({ note: note(projectId) }, "owner@example.com");

    expect(result).toEqual({ status: 500, body: { msg: "Database error" } });
  });

  it("answers 400 when no note is sent", async () => {
    expect((await post({})).status).toBe(400);
  });
});

describe("POST /api/note through a password-protected Share", () => {
  const PASSWORD_REQUIRED = {
    status: 403,
    body: { msg: "Share password required.", code: "sharePasswordRequired" },
  };

  // The Share token the public route hands out for the right password.
  const openShare = async (password: string, shareUrl = "rough-cut") => {
    const { status, body } = await callApi(publicProject, { shareUrl, password });
    expect(status).toBe(200);
    return body.shareToken as string;
  };

  const removeDone = (projectId: string, email?: string, shareToken?: string) =>
    post({ action: NoteApiAction.REMOVE_DONE_NOTES, projectId }, email, shareToken);

  it("asks a guest or another user without a Share token for the password", async () => {
    const projectId = await seed({ canEdit: true, password: "hunter2" });

    expect(await post({ note: note(projectId) })).toEqual(PASSWORD_REQUIRED);
    expect(await post({ note: note(projectId) }, "visitor@example.com")).toEqual(PASSWORD_REQUIRED);
    expect(await removeDone(projectId)).toEqual(PASSWORD_REQUIRED);
    expect(await removeDone(projectId, "visitor@example.com")).toEqual(PASSWORD_REQUIRED);
    expect(await Note.countDocuments()).toBe(0);
  });

  it("lets a guest or another user write with the Share token", async () => {
    const projectId = await seed({ canEdit: true, password: "hunter2" });
    const shareToken = await openShare("hunter2");

    expect((await post({ note: note(projectId) }, undefined, shareToken)).status).toBe(200);
    expect((await post({ note: note(projectId) }, "visitor@example.com", shareToken)).status).toBe(
      200,
    );
    expect((await removeDone(projectId, undefined, shareToken)).status).toBe(200);
    expect(await Note.countDocuments()).toBe(2);
  });

  it("rejects the old token after a password change", async () => {
    const projectId = await seed({ canEdit: true, password: "hunter2" });
    const oldToken = await openShare("hunter2");

    await attachOrUpdateShare(await Project.findById(projectId), { password: "swordfish" });

    expect(await post({ note: note(projectId) }, undefined, oldToken)).toEqual(PASSWORD_REQUIRED);
    const newToken = await openShare("swordfish");
    expect((await post({ note: note(projectId) }, undefined, newToken)).status).toBe(200);
  });

  it("rejects the old token after unsharing and sharing again at the same url", async () => {
    const projectId = await seed({ canEdit: true, password: "hunter2" });
    const oldToken = await openShare("hunter2");
    const project = await Project.findById(projectId);

    await detachShare(project, { _id: project.share.toString() });
    await attachOrUpdateShare(await Project.findById(projectId), {
      url: "rough-cut",
      password: "hunter2",
      canEdit: true,
    });

    expect(await post({ note: note(projectId) }, undefined, oldToken)).toEqual(PASSWORD_REQUIRED);
  });

  it("forbids writes when the Share has canEdit false, even with a valid token", async () => {
    const projectId = await seed({ canEdit: true, password: "hunter2" });
    const shareToken = await openShare("hunter2");

    await attachOrUpdateShare(await Project.findById(projectId), { canEdit: false });

    expect((await post({ note: note(projectId) }, undefined, shareToken)).status).toBe(403);
    expect((await post({ note: note(projectId) }, undefined, shareToken)).body).toEqual({
      msg: "Not allowed to edit notes in this project.",
    });
    expect(await Note.countDocuments()).toBe(0);
  });

  it("rejects a token for one Share on another Project, even with the same password hash", async () => {
    const projectId = await seed({ canEdit: true, password: "hunter2" });
    const owner = await User.findOne({ email: "owner@example.com" });
    const other = await Project.create({ title: "Other cut", user: owner._id });
    await attachOrUpdateShare(other, { url: "other-cut", password: "hunter2", canEdit: true });
    const tokenForOther = await openShare("hunter2", "other-cut");
    // Same stored hash on both Shares, so only the token's subject tells them apart.
    const { password } = await Share.findOne({ url: "other-cut" });
    await Share.updateOne({ url: "rough-cut" }, { password });

    expect(await post({ note: note(projectId) }, undefined, tokenForOther)).toEqual(
      PASSWORD_REQUIRED,
    );
    expect(
      (await post({ note: note(other._id.toString()) }, undefined, tokenForOther)).status,
    ).toBe(200);
  });

  it("hands out no Share token for an open Share and needs none to write", async () => {
    const projectId = await seed({ canEdit: true });

    const { body } = await callApi(publicProject, { shareUrl: "rough-cut" });

    expect(body).not.toHaveProperty("shareToken");
    expect((await post({ note: note(projectId) })).status).toBe(200);
  });

  it("lets the owner write without a Share token", async () => {
    const projectId = await seed({ canEdit: true, password: "hunter2" });

    expect((await post({ note: note(projectId) }, "owner@example.com")).status).toBe(200);
    expect((await removeDone(projectId, "owner@example.com")).status).toBe(200);
  });

  it("rejects a session token sent as a Share token", async () => {
    const projectId = await seed({ canEdit: true, password: "hunter2" });
    const sessionToken = await tokenFor("visitor@example.com");

    expect(await post({ note: note(projectId) }, undefined, sessionToken)).toEqual(
      PASSWORD_REQUIRED,
    );
  });

  it("rejects a Share token sent as a session token", async () => {
    const projectId = await seed({ canEdit: true, password: "hunter2" });
    const shareToken = await openShare("hunter2");

    const { status } = await callApi(
      handler,
      { note: note(projectId) },
      { authorization: `Bearer ${shareToken}` },
    );

    expect(status).toBe(401);
  });
});
