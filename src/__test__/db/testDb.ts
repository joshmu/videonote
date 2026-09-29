import { randomUUID } from "node:crypto";

import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, inject, vi } from "vitest";

import { connectDb } from "@/utils/mongoose";

/**
 * Give the calling test file its own database on the shared in-memory
 * server, opened through `connectDb`. Collections are emptied after each
 * test; the database is dropped when the file finishes.
 */
export const useTestDb = () => {
  beforeAll(async () => {
    const uri = new URL(inject("mongoUri"));
    uri.pathname = `/test-${randomUUID()}`;
    vi.stubEnv("MONGODB_URI", uri.toString());
    await connectDb();
  });

  afterEach(async () => {
    const collections = Object.values(mongoose.connection.collections);
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    vi.unstubAllEnvs();
  });
};
