import { describe, expect, it } from "vitest";

import { Note, Project, Share, User } from "@/utils/mongoose";
import {
  findProjectsWithRelations,
  findProjectWithRelations,
} from "@/utils/project/findProjectWithRelations";

import { useTestDb } from "../db/testDb";

useTestDb();

describe("findProjectWithRelations", () => {
  it("hydrates a project with its notes (each with its author) and its share", async () => {
    const owner = await User.create({ email: "owner@example.com", username: "owner" });
    const project = await Project.create({ title: "Rough cut", user: owner._id });
    const note = await Note.create({ content: "Trim", project: project._id, user: owner._id });
    const share = await Share.create({ url: "rough-cut", user: owner._id, project: project._id });
    project.notes.push(note._id);
    project.share = share._id;
    await project.save();

    const hydrated = (await findProjectWithRelations({ _id: project._id })).toObject();

    expect(hydrated.notes).toEqual([
      expect.objectContaining({
        _id: note._id,
        content: "Trim",
        user: { _id: owner._id, username: "owner", email: "owner@example.com" },
      }),
    ]);
    expect(hydrated.share).toMatchObject({ _id: share._id, url: "rough-cut", canEdit: true });
  });

  it("returns null when no project matches", async () => {
    const owner = await User.create({ email: "owner@example.com" });

    expect(await findProjectWithRelations({ user: owner._id })).toBeNull();
  });
});

describe("findProjectsWithRelations", () => {
  it("hydrates every matching project with its notes and share", async () => {
    const owner = await User.create({ email: "owner@example.com", username: "owner" });
    const first = await Project.create({ title: "First", user: owner._id });
    const second = await Project.create({ title: "Second", user: owner._id });
    const note = await Note.create({ content: "Trim", project: second._id, user: owner._id });
    const share = await Share.create({ url: "second", user: owner._id, project: second._id });
    second.notes.push(note._id);
    second.share = share._id;
    await second.save();

    const hydrated = await findProjectsWithRelations({ user: owner._id });

    const byTitle = Object.fromEntries(hydrated.map((project) => [project.title, project]));
    expect(Object.keys(byTitle).sort()).toEqual(["First", "Second"]);
    expect(byTitle.First._id).toEqual(first._id);
    expect(byTitle.Second.toObject().notes).toEqual([
      expect.objectContaining({
        content: "Trim",
        user: { _id: owner._id, username: "owner", email: "owner@example.com" },
      }),
    ]);
    expect(byTitle.Second.toObject().share).toMatchObject({ url: "second" });
  });
});
