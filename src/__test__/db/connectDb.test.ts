// @vitest-environment node
import mongoose from "mongoose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadModelModule = () => import("@/utils/mongoose");

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("MONGODB_URI", "mongodb://db.test/videonote");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("model module", () => {
  it("opens no connection when imported", async () => {
    const connect = vi.spyOn(mongoose, "connect").mockResolvedValue(mongoose);

    await loadModelModule();

    expect(connect).not.toHaveBeenCalled();
  });
});

describe("connectDb", () => {
  it("connects once to MONGODB_URI however many callers ask", async () => {
    const connect = vi.spyOn(mongoose, "connect").mockResolvedValue(mongoose);
    const { connectDb } = await loadModelModule();

    await Promise.all([connectDb(), connectDb()]);
    await connectDb();

    expect(connect).toHaveBeenCalledTimes(1);
    expect(connect).toHaveBeenCalledWith("mongodb://db.test/videonote");
  });

  it("retries on the next call after a failed connect", async () => {
    const connect = vi
      .spyOn(mongoose, "connect")
      .mockRejectedValueOnce(new Error("unreachable"))
      .mockResolvedValue(mongoose);
    const { connectDb } = await loadModelModule();

    await expect(connectDb()).rejects.toThrow("unreachable");
    await expect(connectDb()).resolves.toBe(mongoose);

    expect(connect).toHaveBeenCalledTimes(2);
  });
});
