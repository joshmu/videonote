import { StatusCodes } from "http-status-codes";
import type { NextApiRequest, NextApiResponse } from "next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/utils/jwt", () => ({
  authenticateToken: vi.fn(),
  generateAccessToken: vi.fn(),
}));

vi.mock("@/utils/mongoose", () => ({
  User: { findOne: vi.fn() },
}));

import { withOptionalUser } from "@/utils/auth/withAuthenticatedUser";
import { authenticateToken, generateAccessToken } from "@/utils/jwt";
import { User } from "@/utils/mongoose";

type MockResponse = {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

const buildReq = (headers: Record<string, string> = {}): NextApiRequest =>
  ({ headers, body: {} }) as unknown as NextApiRequest;

const buildRes = (): MockResponse & NextApiResponse => {
  const res: MockResponse = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as MockResponse & NextApiResponse;
};

describe("withOptionalUser", () => {
  beforeEach(() => {
    vi.mocked(generateAccessToken).mockReturnValue("rotated-token");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("invokes the handler with a guest context when no authorization header is present", async () => {
    const handler = vi.fn();
    const wrapped = withOptionalUser(handler);

    const req = buildReq();
    const res = buildRes();
    await wrapped(req, res);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(req, res, {
      isGuest: true,
      userDoc: null,
      email: null,
      newToken: null,
    });
    expect(res.status).not.toHaveBeenCalled();
    expect(authenticateToken).not.toHaveBeenCalled();
  });

  it("invokes the handler with an authenticated context when a valid token is supplied", async () => {
    const userDoc = { _id: "u1", email: "user@example.com" };
    vi.mocked(authenticateToken).mockReturnValue("user@example.com");
    vi.mocked(User.findOne).mockResolvedValue(userDoc as never);
    vi.mocked(generateAccessToken).mockReturnValue("fresh-jwt");
    const handler = vi.fn();
    const wrapped = withOptionalUser(handler);

    await wrapped(buildReq({ authorization: "Bearer good.token" }), buildRes());

    expect(handler).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      isGuest: false,
      userDoc,
      email: "user@example.com",
      newToken: "fresh-jwt",
    });
  });

  it("returns 401 when a token is supplied but invalid (does not silently fall through to guest)", async () => {
    vi.mocked(authenticateToken).mockImplementation(() => {
      throw new Error("jwt malformed");
    });
    const handler = vi.fn();
    const wrapped = withOptionalUser(handler);

    const res = buildRes();
    await wrapped(buildReq({ authorization: "Bearer bad" }), res);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith({ msg: "Invalid token" });
    expect(handler).not.toHaveBeenCalled();
  });
});
