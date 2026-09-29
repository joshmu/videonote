import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { beforeAll, vi } from "vitest";

import { generateAccessToken } from "@/utils/jwt";

/** Sign tokens with a test secret for the calling file. */
export const useTestJwtSecret = () => {
  beforeAll(() => {
    vi.stubEnv("JWT_TOKEN_SECRET", "test-secret");
  });
};

export type ApiResult = { status: number; body: Record<string, any> };

/** Call a Next.js API handler with a fake req/res and capture the reply. */
export const callApi = async (
  handler: NextApiHandler,
  body: unknown,
  { email }: { email?: string } = {},
): Promise<ApiResult> => {
  const headers = email ? { authorization: `Bearer ${generateAccessToken(email)}` } : {};
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
