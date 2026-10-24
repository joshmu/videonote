import { randomUUID } from "node:crypto";

import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { connectDb } from "@/utils/mongoose";

/**
 * Mongo backend only. Give the calling file (or `describe`) its own database
 * on the shared in-memory server, opened through `connectDb`, with every
 * model's indexes built. Collections are emptied after each test; the database
 * is dropped when the block finishes. Only `MONGODB_URI` is changed, and it is
 * put back afterwards, so other stubbed env (e.g. `JWT_TOKEN_SECRET`) stays.
 */
export const useTestDb = () => {
  let previousUri: string | undefined;

  beforeAll(async () => {
    previousUri = process.env.MONGODB_URI;
    const uri = new URL(inject("mongoUri"));
    uri.pathname = `/test-${randomUUID()}`;
    process.env.MONGODB_URI = uri.toString();
    await connectDb();
    // Unique indexes decide a taken email or Share url, so build them before any test runs.
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  });

  afterEach(async () => {
    const collections = Object.values(mongoose.connection.collections);
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    if (previousUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previousUri;
  });
};
