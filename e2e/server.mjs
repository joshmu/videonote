// Runs the production build against a throwaway database for the e2e suite.
import { spawn } from "node:child_process";

import { MongoMemoryServer } from "mongodb-memory-server";

const PORT = process.env.E2E_PORT ?? "3977";

const db = await MongoMemoryServer.create({ binary: { version: "8.2.6" } });
const app = spawn("pnpm", ["exec", "next", "start", "-p", PORT, "-H", "127.0.0.1"], {
  stdio: "inherit",
  env: {
    ...process.env,
    MONGODB_URI: db.getUri("videonote_e2e"),
    JWT_TOKEN_SECRET: process.env.JWT_TOKEN_SECRET ?? "e2e-secret",
  },
});

const stop = async () => {
  app.kill();
  await db.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
app.on("exit", async (code) => {
  await db.stop();
  process.exit(code ?? 0);
});
