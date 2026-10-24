import { expect, test } from "@playwright/test";

import { ProjectApiActions } from "@/shared/types";

import { objectId, ok, registeredUser } from "../support/api";

const { CREATE, GET, REMOVE } = ProjectApiActions;

const ownerWithProject = async () => {
  const owner = await registeredUser();
  const { project } = ok(await owner.api.project(CREATE, { title: "notes" }));
  return { ...owner, projectId: project._id! };
};

test.describe("notes", () => {
  test("an owner adds, edits and ticks Notes, and they persist", async () => {
    const { api, projectId } = await ownerWithProject();
    const _id = objectId();

    const created = ok(await api.saveNote({ _id, project: projectId, content: "hello", time: 12 }));
    expect(created.note).toMatchObject({ _id, content: "hello", time: 12, done: false });
    expect(created.note.user).toMatchObject({ role: "owner" });

    ok(await api.saveNote({ _id, project: projectId, content: "hello again", done: true }));

    const { project } = ok(await api.project(GET, { _id: projectId }));
    expect(project.notes).toHaveLength(1);
    expect(project.notes[0]).toMatchObject({ _id, content: "hello again", time: 12, done: true });
  });

  test("a Note defaults to time 0 and not done", async () => {
    const { api, projectId } = await ownerWithProject();

    const { note } = ok(await api.saveNote({ _id: objectId(), project: projectId, content: "x" }));

    expect(note).toMatchObject({ time: 0, done: false });
  });

  test("invalid Notes are refused", async () => {
    const { api, projectId } = await ownerWithProject();

    for (const note of [
      { _id: objectId(), project: projectId, content: "" },
      { _id: objectId(), project: projectId, content: "x", time: "soon" },
      { _id: "not-an-id", project: projectId, content: "x" },
      { _id: objectId(), project: "not-an-id", content: "x" },
    ]) {
      expect(await api.saveNote(note as never)).toMatchObject({ status: 400 });
    }
  });

  test("a Note on an unknown Project is not found", async () => {
    const { api } = await registeredUser();

    expect(
      await api.saveNote({ _id: objectId(), project: objectId(), content: "x" }),
    ).toMatchObject({ status: 404 });
  });

  test("clearing done Notes keeps the rest", async () => {
    const { api, projectId } = await ownerWithProject();
    const keep = objectId();
    ok(await api.saveNote({ _id: keep, project: projectId, content: "keep" }));
    ok(await api.saveNote({ _id: objectId(), project: projectId, content: "done", done: true }));

    const { notes } = ok(await api.removeDoneNotes(projectId));

    expect(notes.map((note) => note._id)).toEqual([keep]);
    const { project } = ok(await api.project(GET, { _id: projectId }));
    expect(project.notes.map((note) => note._id)).toEqual([keep]);
  });

  test("another User cannot write Notes on an unshared Project", async () => {
    const { projectId } = await ownerWithProject();
    const other = await registeredUser();

    expect(
      await other.api.saveNote({ _id: objectId(), project: projectId, content: "x" }),
    ).toMatchObject({ status: 403 });
    expect(await other.api.removeDoneNotes(projectId)).toMatchObject({ status: 403 });
  });

  test("an existing Note stays on its own Project whatever the payload says", async () => {
    const { api, projectId } = await ownerWithProject();
    const { project: other } = ok(await api.project(CREATE, { title: "other" }));
    const _id = objectId();
    ok(await api.saveNote({ _id, project: projectId, content: "here" }));

    ok(await api.saveNote({ _id, project: other._id, content: "moved?" }));

    expect(ok(await api.project(GET, { _id: other._id })).project.notes).toEqual([]);
    expect(ok(await api.project(GET, { _id: projectId })).project.notes[0].content).toBe("moved?");
  });

  test("removing a Project removes its Notes", async () => {
    const { api, projectId } = await ownerWithProject();
    const _id = objectId();
    ok(await api.saveNote({ _id, project: projectId, content: "gone" }));

    ok(await api.project(REMOVE, { _id: projectId }));

    expect(await api.saveNote({ _id, content: "still here?" })).toMatchObject({ status: 400 });
  });
});
