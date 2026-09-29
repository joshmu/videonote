import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateAccessToken } from "@/utils/jwt";

import { callApi } from "../api/http";

// A fresh model module per test, so connectDb holds no cached connection.
const loadWrappers = () => import("@/utils/auth/withAuthenticatedUser");

let connect: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("MONGODB_URI", "mongodb://db.test/videonote");
  vi.stubEnv("JWT_TOKEN_SECRET", "test-secret");
  connect = vi.spyOn(mongoose, "connect").mockRejectedValue(new Error("unreachable"));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("auth wrappers reject a bad token before opening the database", () => {
  it.each([
    ["no token", undefined],
    ["an invalid token", "Bearer not-a-jwt"],
  ])("withAuthenticatedUser replies 401 to %s while the database is down", async (_, header) => {
    const { withAuthenticatedUser } = await loadWrappers();
    const handler = vi.fn();

    const { status } = await callApi(withAuthenticatedUser(handler), {}, { authorization: header });

    expect(status).toBe(StatusCodes.UNAUTHORIZED);
    expect(connect).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it("withOptionalUser replies 401 to an invalid token while the database is down", async () => {
    const { withOptionalUser } = await loadWrappers();
    const handler = vi.fn();

    const { status } = await callApi(withOptionalUser(handler), {}, { authorization: "Bearer x" });

    expect(status).toBe(StatusCodes.UNAUTHORIZED);
    expect(connect).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("auth wrappers open the database when the request needs it", () => {
  it("withAuthenticatedUser connects for a valid token", async () => {
    const { withAuthenticatedUser } = await loadWrappers();
    const handler = vi.fn();

    await expect(
      callApi(withAuthenticatedUser(handler), {}, { email: "user@example.com" }),
    ).rejects.toThrow("unreachable");

    expect(connect).toHaveBeenCalledTimes(1);
    expect(handler).not.toHaveBeenCalled();
  });

  it("withOptionalUser connects before serving a guest", async () => {
    const { withOptionalUser } = await loadWrappers();
    const handler = vi.fn();

    await expect(callApi(withOptionalUser(handler), {})).rejects.toThrow("unreachable");

    expect(connect).toHaveBeenCalledTimes(1);
    expect(handler).not.toHaveBeenCalled();
  });
});
