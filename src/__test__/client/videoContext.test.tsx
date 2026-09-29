import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ModalType } from "@/components/Modals/Modals";
import type { ProjectInterface } from "@/components/shared/types";
import { NotificationProvider, useNotificationContext } from "@/context/notificationContext";
import { ProjectsProvider, useProjectsContext } from "@/context/projectsContext";
import { SessionProvider, useSessionContext } from "@/context/sessionContext";
import { UiShellProvider, useUiShellContext } from "@/context/uiShellContext";
import { VideoProvider, useVideoContext } from "@/context/videoContext";

import { fakeTransport, ok } from "./providerHarness";

vi.mock("next/router", () => ({ default: { push: vi.fn() } }));

const WEB_SRC = "https://cdn.example.com/cut.mov";

const project = (src: string): ProjectInterface => ({
  _id: "p1",
  title: "Rough cut",
  src,
  user: "u1",
  notes: [],
});

// what the player's onError hands over when the media element gives up
const formatError = {
  target: { error: { code: 4, message: "MEDIA_ELEMENT_ERROR: Format error" } },
};

const OTHER_SRC = "https://cdn.example.com/other.mp4";

const renderVideo = async (src: string) => {
  const transport = fakeTransport({
    "/api/settings": ({ settings }) => ok({ settings }),
    "/api/project": ({ project: sent }) =>
      ok({
        project:
          sent._id === "p2" ? { ...project(OTHER_SRC), _id: "p2" } : { ...project(src), ...sent },
      }),
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>
      <UiShellProvider>
        <SessionProvider api={transport.api} sessionStore={transport.sessionStore}>
          <ProjectsProvider>
            <VideoProvider>{children}</VideoProvider>
          </ProjectsProvider>
        </SessionProvider>
      </UiShellProvider>
    </NotificationProvider>
  );
  const { result } = renderHook(
    () => ({
      ...useVideoContext(),
      ...useProjectsContext(),
      startSession: useSessionContext().startSession,
      modalsOpen: useUiShellContext().modalsOpen,
      alerts: useNotificationContext().alerts,
      addAlert: useNotificationContext().addAlert,
    }),
    { wrapper },
  );
  await act(async () => {
    const account = result.current.startSession({
      user: {
        _id: "u1",
        username: "owner",
        settings: { _id: "set1", currentProject: "p1" },
        projects: [project(src), { ...project(OTHER_SRC), _id: "p2" }],
      },
    });
    result.current.openProjects(account);
  });
  await waitFor(() => expect(result.current.url).toBe(src));
  const updates = () =>
    transport.requests.filter(
      (request) => request.path === "/api/project" && request.body.action === "UPDATE",
    );
  return { result, updates };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("videoContext playback errors", () => {
  it("keeps a web src and warns with a codec hint when this browser can't play it", async () => {
    const { result, updates } = await renderVideo(WEB_SRC);

    act(() => result.current.handlePlayerError(formatError));

    const warning = result.current.alerts.find((alert) => alert.type === "warning");
    render(<>{warning?.msg}</>);
    expect(screen.getByText(/re-encode it to H\.264\/AAC/)).toBeInTheDocument();
    expect(updates()).toEqual([]);
    expect(result.current.project.src).toBe(WEB_SRC);
    expect(result.current.url).toBe(WEB_SRC);
    expect(result.current.modalsOpen).not.toContain(ModalType.CURRENT_PROJECT);
  });

  it("plays a local file offered by the warning without saving it", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:local-copy");
    const { result, updates } = await renderVideo(WEB_SRC);

    act(() => result.current.handlePlayerError(formatError));
    const warning = result.current.alerts.find((alert) => alert.type === "warning");
    act(() => {
      result.current.addAlert({ msg: "Saved" });
    });
    const { container } = render(<>{warning?.msg}</>);
    const file = new File(["frames"], "cut.mp4", { type: "video/mp4" });
    act(() => {
      fireEvent.change(container.querySelector("input[type=file]"), { target: { files: [file] } });
    });

    await waitFor(() => expect(result.current.url).toBe("blob:local-copy"));
    const alertsLeft = result.current.alerts.map((alert) => alert.msg);
    expect(alertsLeft).not.toContain(warning.msg);
    expect(alertsLeft).toContain("Saved");
    expect(updates()).toEqual([]);
    expect(result.current.project.src).toBe(WEB_SRC);

    // a later change to the project (its notes) keeps the local copy playing
    await act(async () => result.current.updateProjectsStateWithUpdatedNotes([]));
    expect(result.current.url).toBe("blob:local-copy");
  });

  it("clears a stale blob src from an earlier session and asks for a source", async () => {
    const { result, updates } = await renderVideo("blob:https://videonote.app/stale");

    await act(async () => result.current.handlePlayerError(formatError));

    await waitFor(() => expect(updates()).toHaveLength(1));
    expect(updates()[0].body.project).toMatchObject({ _id: "p1", src: "" });
    expect(result.current.modalsOpen).toContain(ModalType.CURRENT_PROJECT);
  });

  it("clears a stale blob src whatever the error message says", async () => {
    const { result, updates } = await renderVideo("blob:https://videonote.app/stale");
    const networkError = { target: { error: { code: 2, message: "NS_ERROR_DOM_MEDIA_NETWORK" } } };

    await act(async () => result.current.handlePlayerError(networkError));

    await waitFor(() => expect(updates()).toHaveLength(1));
    expect(updates()[0].body.project).toMatchObject({ _id: "p1", src: "" });
  });

  it("shows one warning per project and drops it when another project loads", async () => {
    const { result } = await renderVideo(WEB_SRC);
    const warnings = () => result.current.alerts.filter((alert) => alert.type === "warning");

    act(() => result.current.handlePlayerError(formatError));
    act(() => result.current.handlePlayerError(formatError));
    expect(warnings()).toHaveLength(1);

    await act(async () => result.current.loadProject("p2"));

    await waitFor(() => expect(result.current.url).toBe(OTHER_SRC));
    expect(warnings()).toEqual([]);
  });
});
