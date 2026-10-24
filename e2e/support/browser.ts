import { readFileSync } from "node:fs";

import { test as base } from "@playwright/test";

import { CLIP_PATH } from "../global-setup";

/** Every Project in the browser journeys points its video here. */
export const VIDEO_URL = "https://video.test/clip.webm";

/** A page where VIDEO_URL plays the generated clip, so the player and note input load. */
export const test = base.extend({
  page: async ({ page }, use) => {
    const clip = readFileSync(CLIP_PATH);
    await page.route("https://video.test/**", (route) =>
      route.fulfill({ status: 200, contentType: "video/webm", body: clip }),
    );
    await use(page);
  },
});

export { expect } from "@playwright/test";
