/**
 * Generate Access Token Secret
 * generate token secret > require('crypto').randomBytes(64).toString('hex')
 */

import jwt from "jsonwebtoken";

/**
 * Verify a session token and return its subject, the User._id. Throws for a
 * bad signature, an expired token or a payload without a non-empty string `sub`.
 */
export const authenticateToken = (token: string): string => {
  const { sub } = jwt.verify(token, process.env.JWT_TOKEN_SECRET) as jwt.JwtPayload;
  if (typeof sub !== "string" || sub === "") throw new Error("Token has no subject");
  return sub;
};

/** Mint a 30 minute session token whose subject is the User._id. */
export const generateAccessToken = (userId: string): string =>
  jwt.sign({}, process.env.JWT_TOKEN_SECRET, { subject: userId, expiresIn: 60 * 30 });
