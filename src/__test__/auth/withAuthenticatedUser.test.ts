import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import type { NextApiHandler } from "next";
import { describe, expect, it, vi } from "vitest";

import { withAuthenticatedUser, withOptionalUser } from "@/utils/auth/withAuthenticatedUser";
import { authenticateToken, generateAccessToken } from "@/utils/jwt";
import { User } from "@/utils/mongoose";

import { callApi, useTestJwtSecret } from "../api/http";
import { useTestDb } from "../db/testDb";

useTestDb();
useTestJwtSecret();

const EMAIL = "user@example.com";

const call = (wrapped: NextApiHandler, authorization?: string) =>
  callApi(wrapped, {}, { authorization });

describe("withAuthenticatedUser", () => {
  it("replies 401 without calling the handler when no token is sent", async () => {
    const handler = vi.fn();

    const { status, body } = await call(withAuthenticatedUser(handler));

    expect(status).toBe(StatusCodes.UNAUTHORIZED);
    expect(body).toEqual({ msg: "No token. Authorization denied." });
    expect(handler).not.toHaveBeenCalled();
  });

  it("replies 401 for a token signed with another secret", async () => {
    await User.create({ email: EMAIL });
    const forged = jwt.sign({ email: EMAIL }, "other-secret");
    const handler = vi.fn();

    const { status, body } = await call(withAuthenticatedUser(handler), `Bearer ${forged}`);

    expect(status).toBe(StatusCodes.UNAUTHORIZED);
    expect(body).toEqual({ msg: "Invalid token" });
    expect(handler).not.toHaveBeenCalled();
  });

  it.each([
    ["an email payload without a subject", { email: EMAIL }],
    ["an empty subject", { sub: "" }],
    ["a non-string subject", { sub: 42 }],
  ])("replies 401 for a token with %s", async (_label, payload) => {
    await User.create({ email: EMAIL });
    const handler = vi.fn();
    const token = jwt.sign(payload, "test-secret");

    const { status, body } = await call(withAuthenticatedUser(handler), `Bearer ${token}`);

    expect(status).toBe(StatusCodes.UNAUTHORIZED);
    expect(body).toEqual({ msg: "Invalid token" });
    expect(handler).not.toHaveBeenCalled();
  });

  it.each([
    ["an unknown user id", () => new Types.ObjectId().toString()],
    ["a subject that is not a user id", () => EMAIL],
  ])("replies 401 when the token's subject is %s", async (_label, subject) => {
    await User.create({ email: EMAIL });
    const handler = vi.fn();

    const { status, body } = await call(
      withAuthenticatedUser(handler),
      `Bearer ${generateAccessToken(subject())}`,
    );

    expect(status).toBe(StatusCodes.UNAUTHORIZED);
    expect(body).toEqual({ msg: "No user found." });
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes the stored User, the email and a rotated token, accepting a lowercase bearer", async () => {
    const user = await User.create({ email: EMAIL });
    const userId = user._id.toString();
    const handler = vi.fn();

    await call(withAuthenticatedUser(handler), `bearer ${generateAccessToken(userId)}`);

    expect(handler).toHaveBeenCalledTimes(1);
    const ctx = handler.mock.calls[0][2];
    expect(ctx.userDoc._id).toEqual(user._id);
    expect(ctx.email).toBe(EMAIL);
    expect(jwt.decode(ctx.newToken)).toMatchObject({ sub: userId });
    expect(authenticateToken(ctx.newToken)).toBe(userId);
  });

  it("keeps the session after the user's email changes", async () => {
    const user = await User.create({ email: EMAIL });
    const token = generateAccessToken(user._id.toString());
    await User.updateOne({ _id: user._id }, { email: "renamed@example.com" });
    const handler = vi.fn();

    await call(withAuthenticatedUser(handler), `Bearer ${token}`);

    expect(handler.mock.calls[0][2].email).toBe("renamed@example.com");
  });

  it("propagates handler errors", async () => {
    const user = await User.create({ email: EMAIL });
    const boom = new Error("boom");
    const failing = withAuthenticatedUser(() => {
      throw boom;
    });

    await expect(call(failing, `Bearer ${generateAccessToken(user._id.toString())}`)).rejects.toBe(
      boom,
    );
  });
});

describe("withOptionalUser", () => {
  it("calls the handler as a guest when no token is sent", async () => {
    const handler = vi.fn();

    await call(withOptionalUser(handler));

    expect(handler.mock.calls[0][2]).toEqual({
      isGuest: true,
      userDoc: null,
      email: null,
      newToken: null,
    });
  });

  it("calls the handler with the stored User when the token is valid", async () => {
    const user = await User.create({ email: EMAIL });
    const handler = vi.fn();

    await call(withOptionalUser(handler), `Bearer ${generateAccessToken(user._id.toString())}`);

    const ctx = handler.mock.calls[0][2];
    expect(ctx.isGuest).toBe(false);
    expect(ctx.userDoc._id).toEqual(user._id);
  });

  it("replies 401 for an invalid token instead of falling back to guest", async () => {
    const handler = vi.fn();

    const { status, body } = await call(withOptionalUser(handler), "Bearer not-a-jwt");

    expect(status).toBe(StatusCodes.UNAUTHORIZED);
    expect(body).toEqual({ msg: "Invalid token" });
    expect(handler).not.toHaveBeenCalled();
  });
});
