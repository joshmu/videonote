import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import { ProjectApiActions } from "@/shared/types";

import { newClient, objectId, ok, registeredUser } from "../support/api";

const { CREATE, SHARE, REMOVE_SHARE, REMOVE, GET } = ProjectApiActions;

const shareUrl = () => `e2e-${randomUUID().slice(0, 8)}`;

/** An owner with a Project that already has one Note of theirs. */
const ownerWithProject = async () => {
  const owner = await registeredUser();
  const { project } = ok(
    await owner.api.project(CREATE, { title: "shared", src: "https://x.test/v.mp4" }),
  );
  ok(await owner.api.saveNote({ _id: objectId(), project: project._id, content: "owner note" }));
  return { ...owner, projectId: project._id! };
};

const share = async (
  owner: Awaited<ReturnType<typeof ownerWithProject>>,
  opts: { url?: string; password?: string; canEdit?: boolean } = {},
) => {
  const url = opts.url ?? shareUrl();
  const { project } = ok(
    await owner.api.project(SHARE, { _id: owner.projectId }, { url, canEdit: false, ...opts }),
  );
  return { url, share: project.share as { _id: string; url: string; hasPassword: boolean } };
};

test.describe("share", () => {
  test("an open Share is readable by a guest without emails or password hashes", async () => {
    const owner = await ownerWithProject();
    const { url, share: created } = await share(owner);
    expect(created).toMatchObject({ url, canEdit: false, hasPassword: false });

    const access = await newClient().api.openShare(url);

    expect(access.kind).toBe("ok");
    if (access.kind !== "ok") return;
    expect(access.shareToken).toBeUndefined();
    expect(access.project).toMatchObject({ title: "shared", src: "https://x.test/v.mp4" });
    expect(access.project.notes).toHaveLength(1);
    expect(access.project.notes[0].user).toMatchObject({ role: "owner" });
    const body = JSON.stringify(access.project);
    expect(body).not.toContain(owner.email);
    expect(body).not.toContain('password":');
  });

  test("an unknown Share is not found", async () => {
    expect(await newClient().api.openShare(shareUrl())).toEqual({ kind: "notFound" });
  });

  test("a read-only Share refuses guest Notes", async () => {
    const owner = await ownerWithProject();
    await share(owner, { canEdit: false });
    const guest = newClient();

    expect(
      await guest.api.saveNote({ _id: objectId(), project: owner.projectId, content: "hi" }),
    ).toMatchObject({ status: 403 });
  });

  test("an editable Share takes guest and member Notes, which the owner sees", async () => {
    const owner = await ownerWithProject();
    const { url } = await share(owner, { canEdit: true });
    const guest = newClient();
    const member = await registeredUser();

    const guestNote = ok(
      await guest.api.saveNote({
        _id: objectId(),
        project: owner.projectId,
        content: "from guest",
      }),
    ).note;
    const memberNote = ok(
      await member.api.saveNote({
        _id: objectId(),
        project: owner.projectId,
        content: "from member",
      }),
    ).note;
    expect(guestNote.user).toBeUndefined();
    expect(memberNote.user).toMatchObject({ role: "member" });

    const { project } = ok(await owner.api.project(GET, { _id: owner.projectId }));
    expect(project.notes.map((note) => note.content)).toEqual(
      expect.arrayContaining(["owner note", "from guest", "from member"]),
    );
    const access = await guest.api.openShare(url);
    expect(access.kind === "ok" && access.project.notes).toHaveLength(3);
  });

  test("a password-protected Share asks, refuses a wrong password and hands a Share token", async () => {
    const owner = await ownerWithProject();
    const { url, share: created } = await share(owner, { password: "s3cret", canEdit: true });
    expect(created.hasPassword).toBe(true);
    const guest = newClient();

    expect(await guest.api.openShare(url)).toEqual({ kind: "passwordRequired" });
    expect(await guest.api.openShare(url, "wrong")).toEqual({ kind: "incorrect" });
    const access = await guest.api.openShare(url, "s3cret");
    expect(access.kind).toBe("ok");
    const shareToken = access.kind === "ok" ? access.shareToken : undefined;
    expect(shareToken).toBeTruthy();

    const note = { _id: objectId(), project: owner.projectId, content: "with token" };
    expect(await guest.api.saveNote(note)).toMatchObject({ kind: "sharePasswordRequired" });
    ok(await guest.api.saveNote(note, shareToken));
  });

  test("a new password revokes earlier Share tokens", async () => {
    const owner = await ownerWithProject();
    const { url } = await share(owner, { password: "one", canEdit: true });
    const guest = newClient();
    const access = await guest.api.openShare(url, "one");
    const oldToken = access.kind === "ok" ? access.shareToken : undefined;

    ok(
      await owner.api.project(
        SHARE,
        { _id: owner.projectId },
        { url, password: "two", canEdit: true },
      ),
    );

    const note = { _id: objectId(), project: owner.projectId, content: "x" };
    expect(await guest.api.saveNote(note, oldToken)).toMatchObject({
      kind: "sharePasswordRequired",
    });
    expect(await guest.api.openShare(url, "one")).toEqual({ kind: "incorrect" });
    expect((await guest.api.openShare(url, "two")).kind).toBe("ok");
  });

  test("updating a Share without a password keeps it, an empty one removes it", async () => {
    const owner = await ownerWithProject();
    const { url } = await share(owner, { password: "keep", canEdit: false });

    ok(await owner.api.project(SHARE, { _id: owner.projectId }, { url, canEdit: true }));
    expect(await newClient().api.openShare(url)).toEqual({ kind: "passwordRequired" });

    ok(
      await owner.api.project(
        SHARE,
        { _id: owner.projectId },
        { url, password: "", canEdit: true },
      ),
    );
    expect((await newClient().api.openShare(url)).kind).toBe("ok");
  });

  test("a Share url belongs to one Project", async () => {
    const first = await ownerWithProject();
    const second = await ownerWithProject();
    const { url } = await share(first);

    expect(
      await second.api.project(SHARE, { _id: second.projectId }, { url, canEdit: false }),
    ).toMatchObject({ status: 409 });
  });

  test("unsharing closes the Share and frees its url", async () => {
    const owner = await ownerWithProject();
    const { url, share: created } = await share(owner, { canEdit: true });

    ok(await owner.api.project(REMOVE_SHARE, { _id: owner.projectId }, { _id: created._id }));

    expect(await newClient().api.openShare(url)).toEqual({ kind: "notFound" });
    expect(
      await newClient().api.saveNote({ _id: objectId(), project: owner.projectId, content: "x" }),
    ).toMatchObject({ status: 403 });
    const other = await ownerWithProject();
    await share(other, { url });
  });

  test("removing a shared Project closes its Share", async () => {
    const owner = await ownerWithProject();
    const { url } = await share(owner);

    ok(await owner.api.project(REMOVE, { _id: owner.projectId }));

    expect(await newClient().api.openShare(url)).toEqual({ kind: "notFound" });
  });

  test("removing an account keeps its Notes on other Projects, as a guest's", async () => {
    const owner = await ownerWithProject();
    const { url } = await share(owner, { canEdit: true });
    const member = await registeredUser();
    ok(await member.api.saveNote({ _id: objectId(), project: owner.projectId, content: "member" }));

    ok(await member.api.removeAccount({ password: "correct horse battery staple" }));

    const access = await newClient().api.openShare(url);
    expect(access.kind).toBe("ok");
    const left =
      access.kind === "ok" ? access.project.notes.find((n) => n.content === "member") : undefined;
    expect(left).toBeDefined();
    expect(left?.user).toBeUndefined();
  });
});
