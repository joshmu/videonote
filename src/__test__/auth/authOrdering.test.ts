import { StatusCodes } from "http-status-codes";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { withAuthenticatedUser, withOptionalUser } from "@/utils/auth/withAuthenticatedUser";
import { generateAccessToken } from "@/utils/jwt";
import { getStore } from "@/utils/store";

import { callApi } from "../api/http";
import { testId } from "../db/seed";

// The database is down: opening the Store fails, whatever the backend.
vi.mock("@/utils/store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/utils/store")>()),
  getStore: vi.fn(),
}));

const openStore = vi.mocked(getStore);

beforeEach(() => {
  vi.stubEnv("JWT_TOKEN_SECRET", "test-secret");
  openStore.mockReset().mockRejectedValue(new Error("unreachable"));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("auth wrappers reject a bad token before opening the Store", () => {
  it.each([
    ["no token", undefined],
    ["an invalid token", "Bearer not-a-jwt"],
  ])("withAuthenticatedUser replies 401 to %s while the database is down", async (_, header) => {
    const handler = vi.fn();

    const { status } = await callApi(withAuthenticatedUser(handler), {}, { authorization: header });

    expect(status).toBe(StatusCodes.UNAUTHORIZED);
    expect(openStore).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it("withOptionalUser replies 401 to an invalid token while the database is down", async () => {
    const handler = vi.fn();

    const { status } = await callApi(withOptionalUser(handler), {}, { authorization: "Bearer x" });

    expect(status).toBe(StatusCodes.UNAUTHORIZED);
    expect(openStore).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("auth wrappers open the Store when the request needs it", () => {
  it("withAuthenticatedUser opens it for a valid token", async () => {
    const handler = vi.fn();

    const authorization = `Bearer ${generateAccessToken(testId())}`;

    await expect(callApi(withAuthenticatedUser(handler), {}, { authorization })).rejects.toThrow(
      "unreachable",
    );

    expect(openStore).toHaveBeenCalledTimes(1);
    expect(handler).not.toHaveBeenCalled();
  });

  it("withOptionalUser serves a guest and leaves opening the Store to the handler", async () => {
    const handler = vi.fn();

    await callApi(withOptionalUser(handler), {});

    expect(openStore).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      isGuest: true,
      user: null,
      email: null,
      newToken: null,
    });
  });
});
