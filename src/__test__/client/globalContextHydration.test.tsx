import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ProjectInterface } from "@/components/shared/types";
import { GlobalProvider, useGlobalContext } from "@/context/globalContext";

const mocks = vi.hoisted(() => ({ addAlert: vi.fn(), push: vi.fn() }));

vi.mock("@/context/notificationContext", () => ({
  useNotificationContext: () => ({ addAlert: mocks.addAlert }),
}));
vi.mock("next/router", () => ({ default: { push: mocks.push } }));

type Handler = (body: Record<string, any>) => { status: number; body: unknown };

const fetchStub = (routes: Record<string, Handler> = {}) =>
  vi.fn(async (url: string, init: RequestInit) => {
    const path = new URL(url, "http://localhost").pathname;
    const handler = routes[path] ?? (() => ({ status: 401, body: { msg: "No token." } }));
    const { status, body } = handler(JSON.parse(init.body as string));
    return new Response(JSON.stringify(body), { status });
  });

let ctx: ReturnType<typeof useGlobalContext>;
const Probe = () => {
  ctx = useGlobalContext();
  return ctx.promptState.isOpen ? <div data-testid="prompt">{ctx.promptState.msg}</div> : null;
};
const promptText = () => screen.queryByTestId("prompt")?.textContent;

const renderGlobal = (serverData: Record<string, unknown>) =>
  render(
    <GlobalProvider serverData={serverData}>
      <Probe />
    </GlobalProvider>,
  );

const sharedProject: ProjectInterface = {
  _id: "p1",
  title: "Rough cut",
  src: "https://example.com/video.mp4",
  user: "owner",
  share: { _id: "s1", url: "rough-cut", canEdit: false },
  notes: [{ _id: "n1", content: "Trim", time: 3, project: "p1", user: { _id: "u1" } as any }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("globalContext hydration", () => {
  it("shows a guest the shared project and its notes from the public payload", async () => {
    const fetch = fetchStub();
    vi.stubGlobal("fetch", fetch);

    await act(async () => {
      renderGlobal({ share: { kind: "ok", project: sharedProject } });
    });

    expect(ctx.admin).toBe(false);
    expect(ctx.project).toMatchObject({ _id: "p1", title: "Rough cut" });
    expect(ctx.project.notes.map((n) => n.content)).toEqual(["Trim"]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("loads the signed-in user's current project through the project route", async () => {
    const loaded = { ...sharedProject, share: undefined, title: "Loaded" };
    const fetch = fetchStub({
      "/api/project": () => ({ status: 200, body: { project: loaded } }),
      "/api/settings": ({ settings }) => ({ status: 200, body: { settings } }),
    });
    vi.stubGlobal("fetch", fetch);

    await act(async () => {
      renderGlobal({
        user: {
          _id: "u1",
          username: "owner",
          email: "owner@example.com",
          settings: { _id: "set1", currentProject: "p1" },
          projects: [{ ...sharedProject, share: undefined }],
        },
      });
    });

    await waitFor(() => expect(ctx.project?.title).toBe("Loaded"));
    expect(ctx.admin).toBe(true);
    expect(ctx.user).toMatchObject({ username: "owner" });
  });

  it("prompts for a Share password, rejects a wrong one and opens the project with the right one", async () => {
    window.history.pushState({}, "", "/vn/rough-cut");
    const fetch = fetchStub({
      "/api/public_project": ({ shareUrl, password }) =>
        shareUrl !== "rough-cut"
          ? { status: 404, body: { msg: "Share url does not exist." } }
          : password === "hunter2"
            ? { status: 200, body: { user: { projects: [sharedProject] } } }
            : { status: 403, body: { msg: "password incorrect" } },
    });
    vi.stubGlobal("fetch", fetch);

    await act(async () => {
      renderGlobal({ share: { kind: "passwordRequired" } });
    });
    expect(ctx.promptState.passwordRequired).toBe(true);
    expect(promptText()).toMatch(/password is required/);

    await act(async () => ctx.promptState.action({ password: "nope" }));
    await waitFor(() => expect(promptText()).toMatch(/password is incorrect/));
    expect(ctx.project).toBeNull();

    await act(async () => ctx.promptState.action({ password: "hunter2" }));
    await waitFor(() => expect(ctx.project).toMatchObject({ _id: "p1" }));
    expect(ctx.admin).toBe(false);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("sends a {msg}-only payload to login instead of throwing", async () => {
    vi.stubGlobal("fetch", fetchStub());

    await act(async () => {
      renderGlobal({ msg: "Database error" });
    });

    expect(mocks.push).toHaveBeenCalledWith("/login");
    expect(mocks.addAlert).toHaveBeenCalledWith({ type: "error", msg: "Database error" });
  });

  it("sends an expired session to login when a request is unauthorized", async () => {
    vi.stubGlobal("fetch", fetchStub());

    await act(async () => {
      renderGlobal({
        user: { _id: "u1", username: "owner", email: "owner@example.com", projects: [] },
      });
    });
    await act(async () => {
      await ctx.updateUser({ username: "renamed", email: "owner@example.com" });
    });

    expect(mocks.push).toHaveBeenCalledWith("/login");
  });
});
