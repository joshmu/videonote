/**
 * Generate Access Token Secret
 * generate token secret > require('crypto').randomBytes(64).toString('hex')
 */

import jwt from "jsonwebtoken";

type TokenPayload = { email: string };

export const authenticateToken = (token: string): string => {
  const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET) as TokenPayload;
  return decoded.email;
};

export const generateAccessToken = (email: string): string => {
  // expires after half and hour (1800 seconds = 30 minutes)
  const data: TokenPayload = { email };
  return jwt.sign(data, process.env.JWT_TOKEN_SECRET, { expiresIn: 60 * 30 });
};
