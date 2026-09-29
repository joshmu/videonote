import { MongoMemoryServer } from "mongodb-memory-server";
import type { TestProject } from "vitest/node";

// One mongod for the whole run. Pinned so local runs and the CI binary cache agree.
const MONGOMS_VERSION = "8.2.6";

declare module "vitest" {
  export interface ProvidedContext {
    mongoUri: string;
  }
}

export default async function setup(project: TestProject) {
  const server = await MongoMemoryServer.create({ binary: { version: MONGOMS_VERSION } });
  project.provide("mongoUri", server.getUri());
  return async () => {
    await server.stop();
  };
}
