import { afterEach, describe, expect, it, vi } from "vitest";

import { ProjectApiActions } from "@/components/shared/types";
import {
  browserSession,
  createApiClient,
  requestSession,
  type SessionStore,
} from "@/utils/apiClient";

const reply = (status: number, body: unknown) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const memorySession = (token?: string): SessionStore & { token?: string } => {
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

const clientWith = (response: Response | Error, session = memorySession("t1"), origin?: string) => {
  const fetch = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  return { fetch, session, api: createApiClient({ fetch, session, origin }) };
};

describe("createApiClient", () => {
  it("POSTs JSON with the session token and returns ok with the data", async () => {
    const { fetch, api } = clientWith(reply(200, { project: { _id: "p1" } }));

    const result = await api.project(ProjectApiActions.GET, { _id: "p1" });

    expect(result).toEqual({ kind: "ok", status: 200, data: { project: { _id: "p1" } } });
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/project");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer t1",
    });
    expect(JSON.parse(init.body as string)).toEqual({
      action: ProjectApiActions.GET,
      project: { _id: "p1" },
    });
  });

  it("sends no Authorization header without a session token", async () => {
    const { fetch, api } = clientWith(reply(200, { note: {} }), memorySession());

    await api.saveNote({ content: "Trim", project: "p1" });

    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.headers).not.toHaveProperty("Authorization");
  });

  it("prefixes the origin when given one", async () => {
    const { fetch, api } = clientWith(reply(200, { user: {} }), memorySession(), "http://host");

    await api.auth();

    expect(fetch.mock.calls[0][0]).toBe("http://host/api/auth");
  });

  it("saves a token returned by the server in the session", async () => {
    const { session, api } = clientWith(reply(200, { settings: {}, token: "t2" }));

    await api.updateSettings({ seekJump: 5 });

    expect(session.token).toBe("t2");
  });

  it("treats the login 302 reply as ok and saves its token", async () => {
    const { session, api } = clientWith(reply(302, { user: {}, token: "t3" }), memorySession());

    const result = await api.login({ email: "a@b.co", password: "secret" });

    expect(result.kind).toBe("ok");
    expect(session.token).toBe("t3");
  });

  it("returns unauthorized with the server msg on 401", async () => {
    const { session, api } = clientWith(reply(401, { msg: "Invalid token", token: "nope" }));

    const result = await api.auth();

    expect(result).toEqual({ kind: "unauthorized", status: 401, msg: "Invalid token" });
    expect(session.token).toBe("t1");
  });

  it("returns error with the server msg on other failures", async () => {
    const { api } = clientWith(reply(409, { msg: "The email has already been used." }));

    expect(await api.updateUser({ username: "u", email: "a@b.co" })).toEqual({
      kind: "error",
      status: 409,
      msg: "The email has already been used.",
    });
  });

  it("returns error with a fallback msg when a failure has no msg", async () => {
    const { api } = clientWith(reply(500, {}));

    const result = await api.removeDoneNotes("p1");

    expect(result).toMatchObject({ kind: "error", status: 500 });
    expect(result.kind !== "ok" && result.msg).toMatch(/\S/);
  });

  it("returns error for a non-JSON body, whatever the status", async () => {
    for (const status of [200, 502]) {
      const { api } = clientWith(reply(status, "<html>Bad gateway</html>"));

      const result = await api.auth();

      expect(result).toMatchObject({ kind: "error", status });
      expect(result.kind !== "ok" && result.msg).toMatch(/\S/);
    }
  });

  it("returns error when the request itself fails", async () => {
    const { api } = clientWith(new TypeError("Failed to fetch"));

    expect(await api.auth()).toMatchObject({ kind: "error", status: 0 });
  });
});

describe("session token stores", () => {
  afterEach(() => {
    browserSession.remove();
  });

  it("browserSession writes, reads and removes the token cookie", () => {
    browserSession.write("abc");
    expect(browserSession.read()).toBe("abc");
    expect(document.cookie).toContain("token=abc");

    browserSession.remove();
    expect(browserSession.read()).toBeUndefined();
  });

  it("requestSession reads the token from a cookie header and never writes a cookie", () => {
    const session = requestSession("theme=dark; token=from-header");

    expect(session.read()).toBe("from-header");
    session.write("new");
    expect(document.cookie).not.toContain("token=");
    expect(requestSession(undefined).read()).toBeUndefined();
  });
});
