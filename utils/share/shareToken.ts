import { createHash, createHmac } from "node:crypto";

import jwt from "jsonwebtoken";
import type { Types } from "mongoose";

/**
 * The Share token: proof that the caller gave a password-protected Share's
 * password. Its subject is the Share `_id` and its `v` claim a digest of the
 * stored password hash, so a new password or a new Share revokes it.
 */
const SHARE_AUDIENCE = "share";
const SHARE_TOKEN_TTL = "12h";

type ProtectedShare = { _id: Types.ObjectId; password?: string | null };

// Its own secret, derived from the session secret, so neither token verifies as the other.
const shareSecret = (): string =>
  createHmac("sha256", process.env.JWT_TOKEN_SECRET).update("share-token").digest("hex");

const versionOf = (passwordHash: string): string =>
  createHash("sha256").update(passwordHash).digest("hex");

/** Mint a Share token for a Share that has a password. */
export const issueShareToken = (share: ProtectedShare & { password: string }): string =>
  jwt.sign({ v: versionOf(share.password) }, shareSecret(), {
    subject: share._id.toString(),
    audience: SHARE_AUDIENCE,
    expiresIn: SHARE_TOKEN_TTL,
  });

/** True when `token` is a live Share token for this Share and its current password. */
export const verifyShareToken = (token: unknown, share: ProtectedShare): boolean => {
  if (typeof token !== "string" || token === "" || !share.password) return false;
  try {
    const { v } = jwt.verify(token, shareSecret(), {
      audience: SHARE_AUDIENCE,
      subject: share._id.toString(),
    }) as jwt.JwtPayload;
    return v === versionOf(share.password);
  } catch {
    return false;
  }
};
