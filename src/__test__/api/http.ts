import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { beforeAll, vi } from "vitest";

import { generateAccessToken } from "@/utils/jwt";
import { User } from "@/utils/mongoose";

/** Sign tokens with a test secret for the calling file. */
export const useTestJwtSecret = () => {
  beforeAll(() => {
    vi.stubEnv("JWT_TOKEN_SECRET", "test-secret");
  });
};

/** A session token for the stored User with `email`. */
export const tokenFor = async (email: string): Promise<string> => {
  const user = await User.findOne({ email });
  if (!user) throw new Error(`No test user with email ${email}`);
  return generateAccessToken(user._id.toString());
};

export type ApiResult = { status: number; body: Record<string, any> };

/**
 * Call a Next.js API handler with a fake req/res and capture the reply.
 * `email` sends a valid token for the User with that email; `authorization`
 * sends the header as is.
 */
export const callApi = async (
  handler: NextApiHandler,
  body: unknown,
  { email, authorization }: { email?: string; authorization?: string } = {},
): Promise<ApiResult> => {
  const header = email ? `Bearer ${await tokenFor(email)}` : authorization;
  const headers = header ? { authorization: header } : {};
  const req = { method: "POST", headers, body } as unknown as NextApiRequest;
  const result: ApiResult = { status: 0, body: undefined };
  const res = {
    status(code: number) {
      result.status = code;
      return res;
    },
    json(payload: Record<string, any>) {
      result.body = JSON.parse(JSON.stringify(payload));
      return res;
    },
  } as unknown as NextApiResponse;
  await handler(req, res);
  return result;
};
