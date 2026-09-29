import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SETTINGS_DEFAULTS } from "@/components/shared/constants";
import { NotificationProvider, useNotificationContext } from "@/context/notificationContext";
import { SessionProvider, useSessionContext } from "@/context/sessionContext";

import { type Routes, fakeTransport, ok } from "./providerHarness";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/router", () => ({ default: { push: mocks.push } }));

const owner = { _id: "u1", username: "owner", email: "owner@example.com" };

const renderSession = (routes: Routes = {}) => {
  const transport = fakeTransport(routes);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>
      <SessionProvider api={transport.api} sessionStore={transport.sessionStore}>
        {children}
      </SessionProvider>
    </NotificationProvider>
  );
  const { result } = renderHook(
    () => ({
      ...useSessionContext(),
      alerts: useNotificationContext().alerts.map((alert) => alert.msg),
    }),
    { wrapper },
  );
  return { result, ...transport };
};

type Session = ReturnType<typeof renderSession>["result"];

const signIn = (result: Session, settings?: Record<string, unknown>) => {
  let account: ReturnType<Session["current"]["startSession"]>;
  act(() => {
    account = result.current.startSession({
      user: { ...owner, settings, projects: [{ _id: "p1", title: "Cut" }] },
    });
  });
  return account;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sessionContext start", () => {
  it("starts as a guest with the default settings", () => {
    const { result } = renderSession();

    expect(result.current.admin).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.settings).toEqual(SETTINGS_DEFAULTS);
  });

  it("starts a session from the account and hands back its projects", () => {
    const { result } = renderSession();

    const account = signIn(result, { _id: "set1", seekJump: 5, playOffset: null });

    expect(result.current.admin).toBe(true);
    expect(result.current.user).toEqual(owner);
    expect(result.current.settings).toEqual({ ...SETTINGS_DEFAULTS, _id: "set1", seekJump: 5 });
    expect(result.current.alerts).toContain("Logged in: owner");
    expect(account.projects).toEqual([{ _id: "p1", title: "Cut" }]);
  });

  it("sends a {msg}-only payload to login", () => {
    const { result } = renderSession();

    let account: unknown;
    act(() => {
      account = result.current.startSession({ msg: "Database error" });
    });

    expect(account).toBeNull();
    expect(mocks.push).toHaveBeenCalledWith("/login");
    expect(result.current.alerts).toContain("Database error");
    expect(result.current.admin).toBe(false);
  });
});

describe("sessionContext token", () => {
  it("stores a rotated token and sends it on the next request", async () => {
    const { result, sessionStore, requests } = renderSession({
      "/api/user": ({ user }) => ok({ user, token: "t2" }),
      "/api/settings": ({ settings }) => ok({ settings, token: "t3" }),
    });
    signIn(result);

    await act(async () => {
      await result.current.updateUser({ username: "renamed", email: owner.email });
    });
    expect(sessionStore.token).toBe("t2");
    expect(result.current.user).toMatchObject({ username: "renamed" });

    await act(async () => {
      await result.current.updateSettings({ seekJump: 20 });
    });
    expect(requests.at(-1).authorization).toBe("Bearer t2");
    expect(sessionStore.token).toBe("t3");
  });

  it("sends an expired session to login when a request is unauthorized", async () => {
    const { result } = renderSession({
      "/api/user": () => ({ status: 401, body: { msg: "Invalid token" } }),
    });
    signIn(result);

    await act(async () => {
      await result.current.updateUser({ username: "renamed", email: owner.email });
    });

    expect(mocks.push).toHaveBeenCalledWith("/login");
    expect(result.current.alerts).toContain("Session expired, please re-enter your credentials");
  });

  it("reports other failures without leaving the page", async () => {
    const { result } = renderSession({
      "/api/user": () => ({ status: 409, body: { msg: "Email is taken." } }),
    });
    signIn(result);

    await act(async () => {
      await result.current.updateUser({ username: "owner", email: "taken@example.com" });
    });

    expect(mocks.push).not.toHaveBeenCalled();
    expect(result.current.alerts).toContain("Email is taken.");
  });
});

describe("sessionContext settings", () => {
  it("does not save settings for a guest", async () => {
    const { result, requests } = renderSession();

    await act(async () => {
      await result.current.updateSettings({ seekJump: 20 });
    });

    expect(requests).toEqual([]);
  });

  it("saves settings for a signed-in user and fills in the defaults", async () => {
    const { result, requests } = renderSession({
      "/api/settings": ({ settings }) => ok({ settings }),
    });
    signIn(result, { _id: "set1" });

    await act(async () => {
      await result.current.updateSettings({ _id: "set1", seekJump: 20 });
    });

    expect(requests.at(-1)).toMatchObject({
      path: "/api/settings",
      body: { settings: { _id: "set1", seekJump: 20 } },
    });
    expect(result.current.settings).toEqual({ ...SETTINGS_DEFAULTS, _id: "set1", seekJump: 20 });
  });
});

describe("sessionContext removeAccount", () => {
  const removeWith = async (reply: { status: number; body: unknown }) => {
    const session = renderSession({ "/api/user": () => reply });
    signIn(session.result);
    vi.clearAllMocks();
    await act(async () => {
      await session.result.current.removeAccount({ ...owner, password: "secret" });
    });
    return session;
  };

  it("ends the session and leaves for the landing page", async () => {
    const { result, sessionStore, requests } = await removeWith(ok({ msg: "removed" }));

    expect(requests.at(-1).body).toMatchObject({ action: "remove", user: { password: "secret" } });
    expect(sessionStore.token).toBeUndefined();
    expect(mocks.push).toHaveBeenCalledWith("/hello");
    expect(result.current.alerts).toContain("Account removed. Goodbye! 👋");
  });

  it("shows a wrong password without ending the session", async () => {
    const { result, sessionStore } = await removeWith({
      status: 401,
      body: { msg: "Password is incorrect." },
    });

    expect(result.current.alerts).toContain("Password is incorrect.");
    expect(mocks.push).not.toHaveBeenCalled();
    expect(sessionStore.token).toBe("t1");
  });

  it("sends an expired session to login", async () => {
    await removeWith({ status: 401, body: { msg: "Invalid token" } });

    expect(mocks.push).toHaveBeenCalledWith("/login");
  });
});
