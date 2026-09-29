import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProjectInterface } from "@/components/shared/types";
import { NotificationProvider, useNotificationContext } from "@/context/notificationContext";
import { ProjectsProvider, useProjectsContext } from "@/context/projectsContext";
import { SessionProvider, useSessionContext } from "@/context/sessionContext";
import { SharedProjectProvider, useSharedProjectContext } from "@/context/sharedProjectContext";
import { UiShellProvider, useUiShellContext } from "@/context/uiShellContext";

import { type Routes, fakeTransport, ok } from "./providerHarness";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/router", () => ({ default: { push: mocks.push } }));

const sharedProject = (canEdit: boolean): ProjectInterface => ({
  _id: "p1",
  title: "Rough cut",
  src: "v.mp4",
  user: "owner",
  share: { _id: "s1", url: "rough-cut", canEdit },
  notes: [],
});

const renderShared = (routes: Routes = {}) => {
  const transport = fakeTransport(routes, undefined);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>
      <UiShellProvider>
        <SessionProvider api={transport.api} sessionStore={transport.sessionStore}>
          <ProjectsProvider>
            <SharedProjectProvider>{children}</SharedProjectProvider>
          </ProjectsProvider>
        </SessionProvider>
      </UiShellProvider>
    </NotificationProvider>
  );
  const { result } = renderHook(
    () => ({
      ...useSharedProjectContext(),
      project: useProjectsContext().project,
      session: useSessionContext(),
      prompt: useUiShellContext().promptState,
      alerts: useNotificationContext().alerts.map((alert) => alert.msg),
    }),
    { wrapper },
  );
  return { result, ...transport };
};

beforeEach(() => {
  vi.clearAllMocks();
  window.history.pushState({}, "", "/vn/rough-cut");
});

describe("sharedProjectContext open", () => {
  it("shows a guest an open Share read-only when it cannot be edited", () => {
    const { result, requests } = renderShared();

    act(() => result.current.handleShareAccess({ kind: "ok", project: sharedProject(false) }));

    expect(result.current.project).toMatchObject({ _id: "p1" });
    expect(result.current.session.admin).toBe(false);
    expect(result.current.checkCanEdit()).toBe(false);
    expect(requests).toEqual([]);
  });

  it("lets a guest edit a Share with canEdit", () => {
    const { result } = renderShared();

    act(() => result.current.handleShareAccess({ kind: "ok", project: sharedProject(true) }));

    expect(result.current.checkCanEdit()).toBe(true);
  });

  it("lets a signed-in owner edit", () => {
    const { result } = renderShared();

    act(() => {
      result.current.session.startSession({ user: { _id: "u1", username: "owner", projects: [] } });
    });

    expect(result.current.checkCanEdit()).toBe(true);
  });

  it("prompts for the password, retries a wrong one and opens with the right one", async () => {
    const { result, requests } = renderShared({
      "/api/public_project": ({ password }) =>
        password === "hunter2"
          ? ok({ user: { projects: [sharedProject(false)] } })
          : { status: 403, body: { msg: "password incorrect" } },
    });

    act(() => result.current.handleShareAccess({ kind: "passwordRequired" }));
    expect(result.current.prompt.passwordRequired).toBe(true);

    await act(async () => result.current.prompt.action({ password: "nope" }));
    await waitFor(() => expect(requests).toHaveLength(1));
    expect(requests[0].body).toEqual({ shareUrl: "rough-cut", password: "nope" });
    await waitFor(() => expect(result.current.prompt.isOpen).toBe(true));
    expect(result.current.project).toBeNull();

    await act(async () => result.current.prompt.action({ password: "hunter2" }));
    await waitFor(() => expect(result.current.project).toMatchObject({ _id: "p1" }));
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("sends a guest home when the Share does not exist", () => {
    const { result } = renderShared();

    act(() => result.current.handleShareAccess({ kind: "notFound" }));

    expect(result.current.alerts).toContain("Share url does not exist.");
    expect(mocks.push).toHaveBeenCalledWith("/");
  });

  it("sends a guest home with the error when the Share cannot be read", () => {
    const { result } = renderShared();

    act(() =>
      result.current.handleShareAccess({ kind: "error", msg: "Could not reach the server." }),
    );

    expect(result.current.alerts).toContain("Could not reach the server.");
    expect(mocks.push).toHaveBeenCalledWith("/");
  });
});
