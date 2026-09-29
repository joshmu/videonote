import { StatusCodes } from "http-status-codes";
import { isObjectIdOrHexString } from "mongoose";
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

import { authenticateToken, generateAccessToken } from "@/utils/jwt";
import { connectDb, User, type UserDoc } from "@/utils/mongoose";

/**
 * Context passed to handlers wrapped by {@link withAuthenticatedUser}.
 *
 * - `userDoc`: the Mongoose user document for the verified caller
 * - `email`: the caller's stored email (`userDoc.email`)
 * - `newToken`: a freshly rotated JWT the handler should return so the
 *   caller's session is refreshed
 */
export type AuthContext = {
  userDoc: UserDoc;
  email: string;
  newToken: string;
};

/**
 * Context passed to handlers wrapped by {@link withOptionalUser}.
 *
 * When the request carries no `authorization` header `isGuest` is `true` and
 * `userDoc`/`email`/`newToken` are `null`. When a token is present it must be
 * valid; an invalid token short-circuits with 401 (no silent fall-through to
 * the guest branch).
 */
export type OptionalAuthContext =
  | { isGuest: true; userDoc: null; email: null; newToken: null }
  | { isGuest: false; userDoc: UserDoc; email: string; newToken: string };

/**
 * Pull the caller's User._id out of an {@link OptionalAuthContext} as a
 * string, or `null` for guests.
 */
export const extractAuthorId = (ctx: OptionalAuthContext): string | null =>
  ctx.isGuest ? null : ctx.userDoc._id.toString();

export type AuthenticatedHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  ctx: AuthContext,
) => unknown | Promise<unknown>;

export type OptionalAuthHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  ctx: OptionalAuthContext,
) => unknown | Promise<unknown>;

// Anchored at the start so a bogus header like "garbage bearer x.y.z" does not
// silently slice into a valid-looking token; it falls through and 401s.
const extractBearer = (header: string | string[] | undefined): string | null => {
  if (typeof header !== "string" || header.length === 0) return null;
  return header.replace(/^bearer\s+/i, "");
};

type ResolveResult = {
  ctx: AuthContext | null;
  status: number;
  body: { msg: string } | null;
};

// The token's subject is the User._id; the user is looked up by it.
const resolveAuthenticatedUser = async (token: string): Promise<ResolveResult> => {
  let userId: string;
  try {
    userId = authenticateToken(token);
  } catch {
    return { ctx: null, status: StatusCodes.UNAUTHORIZED, body: { msg: "Invalid token" } };
  }

  await connectDb();
  const userDoc = isObjectIdOrHexString(userId) ? await User.findById(userId) : null;
  if (!userDoc) {
    return { ctx: null, status: StatusCodes.UNAUTHORIZED, body: { msg: "No user found." } };
  }

  return {
    ctx: { userDoc, email: userDoc.email, newToken: generateAccessToken(userId) },
    status: StatusCodes.OK,
    body: null,
  };
};

/**
 * Wrap a Next.js API handler so it only runs for authenticated users.
 *
 * The wrapper verifies the token, then opens the database (`connectDb`) and
 * looks up the user, then invokes `handler(req, res, ctx)` with a populated
 * {@link AuthContext}. On any auth failure it responds with 401 and a `msg`
 * body and the inner handler is not called. Handler errors propagate so the framework's error handling
 * can run.
 */
export const withAuthenticatedUser =
  (handler: AuthenticatedHandler): NextApiHandler =>
  async (req, res) => {
    const token = extractBearer(req.headers["authorization"]);
    if (!token) {
      res.status(StatusCodes.UNAUTHORIZED).json({ msg: "No token. Authorization denied." });
      return;
    }
    const result = await resolveAuthenticatedUser(token);
    if (result.ctx === null) {
      res.status(result.status).json(result.body);
      return;
    }
    await handler(req, res, result.ctx);
  };

/**
 * Wrap a Next.js API handler so it accepts both guests and authenticated
 * users.
 *
 * Missing `authorization` header → guest branch (`ctx.isGuest === true`).
 * Present-but-invalid token → 401 (no silent guest fall-through), answered
 * before the database is opened.
 */
export const withOptionalUser =
  (handler: OptionalAuthHandler): NextApiHandler =>
  async (req, res) => {
    const token = extractBearer(req.headers["authorization"]);
    if (!token) {
      // Guests still reach the database through the handler.
      await connectDb();
      await handler(req, res, { isGuest: true, userDoc: null, email: null, newToken: null });
      return;
    }
    const result = await resolveAuthenticatedUser(token);
    if (result.ctx === null) {
      res.status(result.status).json(result.body);
      return;
    }
    await handler(req, res, { isGuest: false, ...result.ctx });
  };
