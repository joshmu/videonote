import { StatusCodes } from "http-status-codes";
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

import type { UserDocInterface } from "@/shared/types";
import { authenticateToken, generateAccessToken } from "@/utils/jwt";
import { User } from "@/utils/mongoose";

/**
 * Context passed to handlers wrapped by {@link withAuthenticatedUser}.
 *
 * - `userDoc`: the Mongoose user document for the verified caller
 * - `email`: the email extracted from the JWT (matches `userDoc.email`)
 * - `newToken`: a freshly rotated JWT the handler should return so the
 *   caller's session is refreshed
 */
export type AuthContext = {
  userDoc: UserDocInterface;
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
  | { isGuest: false; userDoc: UserDocInterface; email: string; newToken: string };

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

const extractBearer = (header: string | string[] | undefined): string | null => {
  if (typeof header !== "string" || header.length === 0) return null;
  return header.replace(/^bearer\s+/i, "");
};

type ResolveResult = {
  ctx: AuthContext | null;
  status: number;
  body: { msg: string } | null;
};

const resolveAuthenticatedUser = async (token: string): Promise<ResolveResult> => {
  let email: string;
  try {
    email = authenticateToken(token);
  } catch {
    return { ctx: null, status: StatusCodes.UNAUTHORIZED, body: { msg: "Invalid token" } };
  }

  const userDoc = (await User.findOne({ email })) as UserDocInterface | null;
  if (!userDoc) {
    return { ctx: null, status: StatusCodes.UNAUTHORIZED, body: { msg: "No user found." } };
  }

  return {
    ctx: { userDoc, email, newToken: generateAccessToken(email) },
    status: StatusCodes.OK,
    body: null,
  };
};

/**
 * Wrap a Next.js API handler so it only runs for authenticated users.
 *
 * The wrapper performs token extraction, JWT verification, and user lookup,
 * then invokes `handler(req, res, ctx)` with a populated {@link AuthContext}.
 * On any failure it responds with 401 and a `msg` body and the inner handler
 * is not called. Handler errors propagate so the framework's error handling
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
 * Present-but-invalid token → 401 (no silent guest fall-through).
 */
export const withOptionalUser =
  (handler: OptionalAuthHandler): NextApiHandler =>
  async (req, res) => {
    const token = extractBearer(req.headers["authorization"]);
    if (!token) {
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
