import { vi } from "vitest";

import { createApiClient, type SessionStore } from "@/utils/apiClient";

export type Reply = { status: number; body: unknown };
export type Routes = Record<string, (body: Record<string, any>) => Reply>;

export const ok = (body: unknown): Reply => ({ status: 200, body });

export const memorySession = (token?: string): SessionStore & { token?: string } => {
  const store = {
    token,
    read: () => store.token,
    write: (next: string) => {
      store.token = next;
    },
    remove: () => {
      store.token = undefined;
    },
  };
  return store;
};

/**
 * A real API client over a fake fetch. Each path answers from `routes`
 * (anything else is a 404) and every request is recorded.
 */
export const fakeTransport = (routes: Routes = {}, token = "t1") => {
  const sessionStore = memorySession(token);
  const requests: { path: string; body: Record<string, any>; authorization?: string }[] = [];
  const fetch = vi.fn(async (path: string, init: RequestInit) => {
    const body = JSON.parse(init.body as string);
    const headers = init.headers as Record<string, string>;
    requests.push({ path, body, authorization: headers.Authorization });
    const reply = routes[path]?.(body) ?? { status: 404, body: { msg: "Not found" } };
    return new Response(JSON.stringify(reply.body), { status: reply.status });
  });
  return { api: createApiClient({ fetch, session: sessionStore }), sessionStore, requests };
};
