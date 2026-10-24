import { randomUUID } from "node:crypto";

import type { Page } from "@playwright/test";

import { ProjectApiActions } from "@/shared/types";

import { objectId, ok, PASSWORD, registeredUser, uniqueEmail } from "../support/api";
import { expect, test, VIDEO_URL } from "../support/browser";

const sharedProject = async (share: { password?: string; canEdit?: boolean }) => {
  const owner = await registeredUser();
  const { project } = ok(
    await owner.api.project(ProjectApiActions.CREATE, { title: "Shared cut", src: VIDEO_URL }),
  );
  ok(await owner.api.saveNote({ _id: objectId(), project: project._id, content: "owner's note" }));
  const url = `e2e-${randomUUID().slice(0, 8)}`;
  ok(await owner.api.project(ProjectApiActions.SHARE, { _id: project._id }, { url, ...share }));
  return { owner, projectId: project._id!, url };
};

// The menu icon, its first-use items and modal buttons animate and never settle for an actionability
// check, so they get the click event directly.
const openMenu = (page: Page) => page.getByRole("button", { name: "Menu" }).dispatchEvent("click");

const addNote = async (page: Page, content: string) => {
  const input = page.locator("#actionInput");
  await input.fill(content);
  await input.press("Enter");
  await expect(page.getByText(content)).toBeVisible();
};

test.describe("user journeys", () => {
  test("a visitor registers, creates a Project, adds a Note and finds it after a reload", async ({
    page,
  }) => {
    const email = uniqueEmail();
    await page.goto("/login");
    await page.getByRole("button", { name: "Register" }).click();
    await page.getByPlaceholder("Email Address").fill(email);
    await page.getByPlaceholder("Password", { exact: true }).fill(PASSWORD);
    await page.getByPlaceholder("Confirm Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page).toHaveURL("/");

    await openMenu(page);
    await page.getByText("create new", { exact: true }).dispatchEvent("click");
    await page.getByLabel("Project Title").fill("My first cut");
    await page.getByLabel("Video URL").fill(VIDEO_URL);
    await page.getByRole("button", { name: "Create" }).dispatchEvent("click");

    await addNote(page, "tighten the intro");
    await page.reload();
    await expect(page.getByText("tighten the intro")).toBeVisible();
  });

  test("a signed-in User logs in and sees their Projects", async ({ page }) => {
    const { api, email } = await registeredUser();
    ok(await api.project(ProjectApiActions.CREATE, { title: "Returning project" }));

    await page.goto("/login");
    await page.getByPlaceholder("Email Address").fill(email);
    await page.getByPlaceholder("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page).toHaveURL("/");
    // The current Project opens on login; its title shows in the sidebar and the player.
    await expect(page.getByText("Returning project").first()).toBeVisible();
  });

  test("a bad session cookie sends the visitor to log in", async ({ page, context }) => {
    await context.addCookies([{ name: "token", value: "garbage", url: "http://localhost:3977" }]);

    await page.goto("/");

    await expect(page).toHaveURL(/\/login$/);
  });

  test("a guest opens a read-only Share and cannot add Notes", async ({ page }) => {
    const { url } = await sharedProject({ canEdit: false });

    await page.goto(`/vn/${url}`);

    await expect(page.getByText("owner's note")).toBeVisible();
    await expect(page.getByText("View only")).toBeVisible();
  });

  test("a guest adds a Note on an editable Share and the owner sees it", async ({ page }) => {
    const { owner, projectId, url } = await sharedProject({ canEdit: true });

    await page.goto(`/vn/${url}`);
    await expect(page.getByText("owner's note")).toBeVisible();
    await addNote(page, "guest feedback");

    // The list shows a Note before its save lands.
    await expect
      .poll(async () => {
        const { project } = ok(await owner.api.project(ProjectApiActions.GET, { _id: projectId }));
        return project.notes.map((note) => note.content);
      })
      .toContain("guest feedback");
  });

  test("a password-protected Share opens after the right password", async ({ page }) => {
    const { url } = await sharedProject({ password: "s3cret", canEdit: true });

    await page.goto(`/vn/${url}`);
    await page.getByPlaceholder("verify password").fill("s3cret");
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(page.getByText("owner's note")).toBeVisible();
    await addNote(page, "protected feedback");
  });

  test("an unknown Share sends the visitor to the welcome page", async ({ page }) => {
    await page.goto(`/vn/e2e-missing-${randomUUID().slice(0, 8)}`);

    await expect(page).toHaveURL(/\/hello$/);
  });
});
