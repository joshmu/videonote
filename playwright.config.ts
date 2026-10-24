import { defineConfig, devices } from "@playwright/test";

import { ORIGIN, PORT } from "./e2e/support/origin";

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: ORIGIN,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "api", testDir: "e2e/api" },
    { name: "browser", testDir: "e2e/browser", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // Serves the existing production build; `pnpm test:e2e` builds first.
    command: "node e2e/server.mjs",
    url: `${ORIGIN}/login`,
    reuseExistingServer: !process.env.CI,
    env: { E2E_PORT: String(PORT) },
    stdout: "ignore",
    stderr: "pipe",
  },
});
