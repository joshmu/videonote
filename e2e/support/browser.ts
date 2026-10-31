import { readFileSync } from "node:fs";

import { test as base } from "@playwright/test";

import { CLIP_PATH } from "../global-setup";

/** Every Project in the browser journeys points its video here. */
export const VIDEO_URL = "https://video.test/clip.webm";

/** Every Project on a YouTube link in the browser journeys points its video here. */
export const YOUTUBE_URL = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";

// Stands in for YouTube's iframe API, which reports a loaded video through onReady.
const YOUTUBE_API_STUB = `
  window.YT = {
    PlayerState: { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3 },
    Player: function (_iframe, config) {
      const player = new Proxy({}, {
        get: (_target, key) => (key === "getDuration" ? () => 60 : () => 0),
      });
      setTimeout(() => config.events.onReady({ target: player }));
      return player;
    },
  };
  window.onYouTubeIframeAPIReady?.();
`;

/** A page where VIDEO_URL plays the generated clip, so the player and note input load. */
export const test = base.extend({
  page: async ({ page }, use) => {
    const clip = readFileSync(CLIP_PATH);
    await page.route("https://video.test/**", (route) =>
      route.fulfill({ status: 200, contentType: "video/webm", body: clip }),
    );
    await page.route("https://www.youtube.com/iframe_api", (route) =>
      route.fulfill({ contentType: "text/javascript", body: YOUTUBE_API_STUB }),
    );
    await page.route(/youtube(-nocookie)?\.com\/embed/, (route) =>
      route.fulfill({ contentType: "text/html", body: "" }),
    );
    await use(page);
  },
});

export { expect } from "@playwright/test";
