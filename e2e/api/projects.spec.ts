import { expect, test } from "@playwright/test";

import { ProjectApiActions } from "@/shared/types";

import { ok, registeredUser } from "../support/api";

const { CREATE, GET, UPDATE, REMOVE } = ProjectApiActions;

test.describe("projects", () => {
  test("Projects list in the order they were created", async () => {
    const { api } = await registeredUser();

    for (const title of ["first", "second", "third"]) {
      ok(await api.project(CREATE, { title, src: `https://example.test/${title}.mp4` }));
    }

    const titles = ok(await api.auth()).user.projects.map((project) => project.title);
    expect(titles).toEqual(["first", "second", "third"]);
  });

  test("a Project needs a title", async () => {
    const { api } = await registeredUser();

    expect(await api.project(CREATE, { title: "" })).toMatchObject({ kind: "error", status: 400 });
  });

  test("an owner reads and updates a Project", async () => {
    const { api } = await registeredUser();
    const created = ok(await api.project(CREATE, { title: "draft" })).project;

    expect(created.src).toBe("");
    ok(
      await api.project(UPDATE, { _id: created._id, title: "final", src: "https://x.test/v.mp4" }),
    );

    const { project } = ok(await api.project(GET, { _id: created._id }));
    expect(project).toMatchObject({ title: "final", src: "https://x.test/v.mp4" });
  });

  test("another User cannot see or change a Project", async () => {
    const owner = await registeredUser();
    const other = await registeredUser();
    const { project } = ok(await owner.api.project(CREATE, { title: "mine" }));

    for (const action of [GET, UPDATE, REMOVE]) {
      expect(await other.api.project(action, { _id: project._id, title: "theirs" })).toMatchObject({
        status: 404,
      });
    }
    expect(ok(await owner.api.project(GET, { _id: project._id })).project.title).toBe("mine");
  });

  test("removing a Project removes it from the list, the rest keep their order", async () => {
    const { api } = await registeredUser();
    const ids: string[] = [];
    for (const title of ["a", "b", "c"]) {
      ids.push(ok(await api.project(CREATE, { title })).project._id!);
    }

    ok(await api.project(REMOVE, { _id: ids[1] }));

    const titles = ok(await api.auth()).user.projects.map((project) => project.title);
    expect(titles).toEqual(["a", "c"]);
    expect(await api.project(GET, { _id: ids[1] })).toMatchObject({ status: 404 });
  });

  test("an unknown or malformed Project id is not found", async () => {
    const { api } = await registeredUser();

    expect(await api.project(GET, { _id: "0123456789abcdef01234567" })).toMatchObject({
      status: 404,
    });
    expect(await api.project(GET, { _id: "nope" })).toMatchObject({ status: 404 });
  });
});
