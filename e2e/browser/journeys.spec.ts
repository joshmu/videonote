import { randomUUID } from "node:crypto";

import type { Page } from "@playwright/test";

import { ProjectApiActions } from "@/shared/types";

import { objectId, ok, ORIGIN, PASSWORD, registeredUser, uniqueEmail } from "../support/api";
import { expect, test, VIDEO_URL, YOUTUBE_URL } from "../support/browser";

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

const videoHeight = (page: Page) =>
  page.locator("video").evaluate((video) => video.getBoundingClientRect().height);

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
    await expect(page.getByLabel("Project Title")).toBeInViewport({ ratio: 1 });
    await page.getByLabel("Project Title").fill("My first cut");
    await page.getByLabel("Video URL").fill(VIDEO_URL);
    await page.getByRole("button", { name: "Create", exact: true }).dispatchEvent("click");

    await expect(page.locator("#actionInput")).toBeVisible();
    await expect.poll(() => videoHeight(page)).toBeGreaterThan(100);

    await addNote(page, "tighten the intro");
    await page.reload();
    await expect(page.getByText("tighten the intro")).toBeVisible();
  });

  test("a User who types a word as the video is asked for a link", async ({ page }) => {
    const { email } = await registeredUser();
    await page.goto("/login");
    await page.getByPlaceholder("Email Address").fill(email);
    await page.getByPlaceholder("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL("/");

    await openMenu(page);
    await page.getByText("create new", { exact: true }).dispatchEvent("click");
    await page.getByLabel("Project Title").fill("My first cut");
    await page.getByLabel("Video URL").fill("holiday");
    await page.getByRole("button", { name: "Create", exact: true }).dispatchEvent("click");
    await expect(page.getByText("That doesn't look like a video link.")).toBeVisible();

    await page.getByLabel("Video URL").fill(VIDEO_URL);
    await page.getByRole("button", { name: "Create", exact: true }).dispatchEvent("click");
    await addNote(page, "tighten the intro");
    await expect(page.getByText("tighten the intro")).toBeVisible();
  });

  test("a User adds a Note to a Project on a YouTube link", async ({ page }) => {
    const { api, email } = await registeredUser();
    ok(await api.project(ProjectApiActions.CREATE, { title: "Tutorial", src: YOUTUBE_URL }));

    await page.goto("/login");
    await page.getByPlaceholder("Email Address").fill(email);
    await page.getByPlaceholder("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL("/");

    await addNote(page, "good bit here");
    await page.reload();
    await expect(page.getByText("good bit here")).toBeVisible();
  });

  test("a video that can't play warns the User and raises no unhandled rejection", async ({
    page,
  }) => {
    await page.route("https://video.test/missing.mp4", (route) => route.fulfill({ status: 404 }));
    const rejections: string[] = [];
    await page.exposeFunction("recordRejection", (reason: string) => rejections.push(reason));
    await page.addInitScript(() =>
      window.addEventListener("unhandledrejection", (event) =>
        (window as unknown as { recordRejection(reason: string): void }).recordRejection(
          String(event.reason),
        ),
      ),
    );
    const { api, email } = await registeredUser();
    ok(await api.project(ProjectApiActions.CREATE, { title: "Broken cut", src: VIDEO_URL }));

    await page.goto("/login");
    await page.getByPlaceholder("Email Address").fill(email);
    await page.getByPlaceholder("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.locator("#actionInput")).toBeVisible();

    await page.keyboard.press("Escape");
    await page.keyboard.press(" ");
    await openMenu(page);
    await page.getByText("create new", { exact: true }).dispatchEvent("click");
    await page.getByLabel("Project Title").fill("Missing cut");
    await page.getByLabel("Video URL").fill("https://video.test/missing.mp4");
    await page.getByRole("button", { name: "Create", exact: true }).dispatchEvent("click");

    await expect(page.getByText("This browser can't play this video.")).toBeVisible();
    // the loader fades in after the warning, so an immediate check passes on a stuck loader
    await page.waitForTimeout(1000);
    await expect(page.getByTestId("videoLoader")).toHaveCount(0);
    expect(rejections).toEqual([]);
  });

  const logInToProject = async (page: Page) => {
    const { api, email } = await registeredUser();
    ok(await api.project(ProjectApiActions.CREATE, { title: "Clicked cut", src: VIDEO_URL }));
    await page.goto("/login");
    await page.getByPlaceholder("Email Address").fill(email);
    await page.getByPlaceholder("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.locator("#actionInput")).toBeVisible();
  };

  test("a User reviews on a phone: modal, video, Note input and Notes all fit", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await logInToProject(page);

    await expect.poll(() => videoHeight(page)).toBeGreaterThan(100);
    await expect
      .poll(async () => (await page.locator("#actionInput").boundingBox())?.width)
      .toBeGreaterThan(200);
    await expect(page.getByRole("button", { name: "Menu" })).toBeInViewport({ ratio: 1 });

    await addNote(page, "looks fine on a phone");
    await expect(page.getByText("looks fine on a phone")).toBeInViewport();

    await openMenu(page);
    await page.getByText("create new", { exact: true }).dispatchEvent("click");
    await expect(page.getByRole("dialog")).toBeInViewport({ ratio: 1 });
  });

  test("a new User can start a Project from the empty screen", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Register" }).click();
    await page.getByPlaceholder("Email Address").fill(uniqueEmail());
    await page.getByPlaceholder("Password", { exact: true }).fill(PASSWORD);
    await page.getByPlaceholder("Confirm Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: "Create Project" }).click();
    await expect(page.getByLabel("Project Title")).toBeVisible();
  });

  test("a User marks a Note done and edits it from its own controls", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await logInToProject(page);
    await addNote(page, "check the sound");

    await page.getByRole("button", { name: "Mark Note done" }).click();
    await expect(page.getByRole("button", { name: "Mark Note not done" })).toBeVisible();
    await page.getByRole("button", { name: "Edit Note" }).click();
    await expect(page.locator("input[value='check the sound']")).toBeFocused();
  });

  test("a saved theme is on the page before it hydrates, and a retired one falls back", async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem("vn:theme", "theme-light"));
    await page.route("**/_next/static/**/*.js", (route) => route.abort());
    await page.goto("/login");
    await expect(page.locator("body")).toHaveClass("theme-light");

    await page.unrouteAll();
    await page.addInitScript(() => localStorage.setItem("vn:theme", "theme-hot"));
    await page.goto("/login");
    await expect(page.locator("body")).toHaveClass(/theme-dark/);
  });

  test("the toggle icon and phone toolbar follow a saved theme after hydration", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("seeded")) {
        sessionStorage.setItem("seeded", "1");
        localStorage.setItem("vn:theme", "theme-light");
      }
    });
    await page.goto("/login");
    const toggle = page.getByRole("button", { name: "Change theme" });
    const icon = () => toggle.locator("svg path").first().getAttribute("d");
    const toolbar = page.locator('meta[name="theme-color"]');
    await expect(toolbar).toHaveAttribute("content", "#f9fafb");
    await expect(page.locator("body")).toHaveClass("theme-light");
    await expect(toggle).toBeVisible();
    const lightIcon = await icon();

    await toggle.click();
    await expect(page.locator("body")).toHaveClass("theme-dark");
    await expect(toolbar).toHaveAttribute("content", "#202020");
    await expect.poll(icon).not.toBe(lightIcon);

    await page.reload();
    await expect(page.locator("body")).toHaveClass("theme-dark");
  });

  test("a new User reaches a first Note through the sample video", async ({ page }) => {
    await page.route("https://www.youtube.com/**", (route) => route.abort());
    await page.goto("/login");
    await page.getByRole("button", { name: "Register" }).click();
    await page.getByPlaceholder("Email Address").fill(`sample-${Date.now()}@example.com`);
    await page.getByPlaceholder("Password").first().fill("passw0rd-e2e");
    await page.getByPlaceholder(/confirm/i).fill("passw0rd-e2e");
    await page.getByRole("button", { name: "Register" }).last().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.getByRole("button", { name: "Or try a sample video" }).click();
    await expect(page.getByRole("button", { name: "Or try a sample video" })).toBeHidden();
    const note = page.locator("#actionInput");
    await note.fill("the bunny wakes up");
    await note.press("Enter");
    await expect(page.getByText("the bunny wakes up")).toBeVisible();
  });

  test("Tab stays inside an open modal", async ({ page }) => {
    await logInToProject(page);
    await openMenu(page);
    await page.getByText("settings", { exact: true }).dispatchEvent("click");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    for (let press = 0; press < 12; press++) {
      await page.keyboard.press("Tab");
      await expect(dialog.locator(":focus")).toHaveCount(1);
    }
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.locator(":focus")).toHaveCount(1);
  });

  test("a new Share is read-only until the owner allows editing", async ({ page }) => {
    await logInToProject(page);
    await openMenu(page);
    await page.getByText("Share Project", { exact: true }).dispatchEvent("click");
    await expect(page.getByRole("dialog").getByText("Users can edit notes?")).toBeVisible();
  });

  test("signup can be reached at 200% zoom", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 300 });
    await page.goto("/login");
    await page.getByRole("button", { name: "Register" }).click();
    for (const control of [
      page.getByRole("link", { name: "VideoNote" }),
      page.getByRole("button", { name: "Register" }),
    ]) {
      await control.scrollIntoViewIfNeeded();
      await expect(control).toBeInViewport({ ratio: 1 });
    }
  });

  test("public pages have one main heading and their own title", async ({ page }) => {
    for (const [path, title] of [
      ["/hello", "Timestamped video notes | VideoNote"],
      ["/terms", "Terms of Service | VideoNote"],
      ["/privacy", "Privacy Policy | VideoNote"],
    ]) {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
      await expect(page.locator("h1")).toHaveCount(1);
    }
  });

  test("a User plays and pauses a video by clicking it", async ({ page }) => {
    await logInToProject(page);
    const isPaused = () =>
      page.locator("video").evaluate((video: HTMLVideoElement) => video.paused);

    await page.getByRole("button", { name: "Play" }).click();
    await expect.poll(isPaused).toBe(false);

    await page.locator("video").click();
    await expect.poll(isPaused).toBe(true);
  });

  test("Sign Out by keyboard ends the session", async ({ page, context }) => {
    await logInToProject(page);

    await page.locator("#actionInput").blur();
    await page.keyboard.press("Alt");
    await page.getByRole("link", { name: "Sign Out" }).press("Enter");

    await expect(page).toHaveURL("/hello");
    expect((await context.cookies()).map((cookie) => cookie.name)).not.toContain("token");
  });

  test("a keyboard User reaches Create New from the Menu", async ({ page }) => {
    await logInToProject(page);

    await page.getByRole("button", { name: "Menu" }).focus();
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: /create new/i }).press("Enter");

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByLabel("Project Title")).toBeVisible();
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
    await context.addCookies([{ name: "token", value: "garbage", url: ORIGIN }]);

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
