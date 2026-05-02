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

import { withAuthenticatedUser } from "@/utils/auth/withAuthenticatedUser";
import { authenticateToken, generateAccessToken } from "@/utils/jwt";
import { User } from "@/utils/mongoose";

type MockResponse = {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

const buildReq = (headers: Record<string, string> = {}): NextApiRequest =>
  ({ headers, body: {} }) as unknown as NextApiRequest;

const buildRes = (): MockResponse & NextApiResponse => {
  const res: MockResponse = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as MockResponse & NextApiResponse;
};

describe("withAuthenticatedUser", () => {
  beforeEach(() => {
    vi.mocked(generateAccessToken).mockReturnValue("rotated-token");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when authorization header is absent", async () => {
    const handler = vi.fn();
    const wrapped = withAuthenticatedUser(handler);

    const req = buildReq();
    const res = buildRes();
    await wrapped(req, res);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith({ msg: "No token. Authorization denied." });
    expect(handler).not.toHaveBeenCalled();
  });

  it("strips the Bearer prefix case-insensitively before verifying the token", async () => {
    vi.mocked(authenticateToken).mockReturnValue("user@example.com");
    vi.mocked(User.findOne).mockResolvedValue({ _id: "u1", email: "user@example.com" } as never);
    const handler = vi.fn();
    const wrapped = withAuthenticatedUser(handler);

    await wrapped(buildReq({ authorization: "bearer abc.def.ghi" }), buildRes());

    expect(authenticateToken).toHaveBeenCalledWith("abc.def.ghi");
  });

  it("returns 401 when jwt verification throws", async () => {
    vi.mocked(authenticateToken).mockImplementation(() => {
      throw new Error("jwt expired");
    });
    const handler = vi.fn();
    const wrapped = withAuthenticatedUser(handler);

    const res = buildRes();
    await wrapped(buildReq({ authorization: "Bearer bad.token" }), res);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith({ msg: "Invalid token" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 401 when no user matches the verified email", async () => {
    vi.mocked(authenticateToken).mockReturnValue("ghost@example.com");
    vi.mocked(User.findOne).mockResolvedValue(null as never);
    const handler = vi.fn();
    const wrapped = withAuthenticatedUser(handler);

    const res = buildRes();
    await wrapped(buildReq({ authorization: "Bearer t" }), res);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith({ msg: "No user found." });
    expect(handler).not.toHaveBeenCalled();
  });

  it("invokes the handler with userDoc, email and a freshly rotated token on the happy path", async () => {
    const userDoc = { _id: "u1", email: "user@example.com" };
    vi.mocked(authenticateToken).mockReturnValue("user@example.com");
    vi.mocked(User.findOne).mockResolvedValue(userDoc as never);
    vi.mocked(generateAccessToken).mockReturnValue("fresh-jwt");
    const handler = vi.fn().mockResolvedValue(undefined);
    const wrapped = withAuthenticatedUser(handler);

    const req = buildReq({ authorization: "Bearer good.token" });
    const res = buildRes();
    await wrapped(req, res);

    expect(generateAccessToken).toHaveBeenCalledWith("user@example.com");
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(req, res, {
      userDoc,
      email: "user@example.com",
      newToken: "fresh-jwt",
    });
  });

  it("propagates handler errors so the framework's error handling can run", async () => {
    vi.mocked(authenticateToken).mockReturnValue("user@example.com");
    vi.mocked(User.findOne).mockResolvedValue({ _id: "u1", email: "user@example.com" } as never);
    const boom = new Error("db down");
    const handler = vi.fn().mockRejectedValue(boom);
    const wrapped = withAuthenticatedUser(handler);

    await expect(wrapped(buildReq({ authorization: "Bearer t" }), buildRes())).rejects.toBe(boom);
  });
});
