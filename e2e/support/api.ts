import { randomUUID } from "node:crypto";

import { createApiClient, type SessionStore } from "@/utils/apiClient";

export const ORIGIN = "http://localhost:3977";

/** A session held in memory, standing in for the browser's token cookie. */
const memorySession = (): SessionStore & { token?: string } => {
  const session: SessionStore & { token?: string } = {
    read: () => session.token,
    write: (token) => {
      session.token = token;
    },
    remove: () => {
      session.token = undefined;
    },
  };
  return session;
};

/** An API client with its own session, like one browser. */
export const newClient = () => {
  const session = memorySession();
  return { api: createApiClient({ fetch: globalThis.fetch, session, origin: ORIGIN }), session };
};

export type Client = ReturnType<typeof newClient>;

export const uniqueEmail = () => `e2e-${randomUUID()}@videonote.test`;

export const PASSWORD = "correct horse battery staple";

/** A freshly registered User, signed in. */
export const registeredUser = async () => {
  const client = newClient();
  const email = uniqueEmail();
  const result = await client.api.register({ email, password: PASSWORD, password2: PASSWORD });
  if (result.kind !== "ok") throw new Error(`register failed: ${JSON.stringify(result)}`);
  return { ...client, email, user: result.data.user };
};

/** Unwrap an ok result or fail the test with the whole result. */
export const ok = <T>(result: { kind: string; data?: T }): T => {
  if (result.kind !== "ok") throw new Error(`expected ok, got ${JSON.stringify(result)}`);
  return result.data as T;
};
export { createObjectId as objectId } from "@/utils/clientHelpers";
