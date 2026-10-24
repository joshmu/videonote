import { defineConfig, devices } from "@playwright/test";

const PORT = 3977;

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    // localhost, not 127.0.0.1: the index page picks https for any other host.
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "api", testDir: "e2e/api" },
    { name: "browser", testDir: "e2e/browser", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // Serves the existing production build; `pnpm test:e2e` builds first.
    command: "node e2e/server.mjs",
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    env: { E2E_PORT: String(PORT) },
    stdout: "ignore",
    stderr: "pipe",
  },
});
