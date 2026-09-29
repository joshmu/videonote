import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ModalType } from "@/components/Modals/Modals";
import { ProjectApiActions, type ProjectInterface } from "@/components/shared/types";
import { NotificationProvider, useNotificationContext } from "@/context/notificationContext";
import { ProjectsProvider, useProjectsContext } from "@/context/projectsContext";
import { SessionProvider, useSessionContext } from "@/context/sessionContext";
import { UiShellProvider, useUiShellContext } from "@/context/uiShellContext";

import { type Routes, fakeTransport, ok } from "./providerHarness";

vi.mock("next/router", () => ({ default: { push: vi.fn() } }));

const project = (id: string, extra: Partial<ProjectInterface> = {}): ProjectInterface => ({
  _id: id,
  title: `Cut ${id}`,
  src: "v.mp4",
  user: "u1",
  notes: [],
  ...extra,
});
const share = { _id: "s1", url: "rough-cut", canEdit: true };

const renderProjects = (routes: Routes = {}) => {
  const transport = fakeTransport({
    "/api/settings": ({ settings }) => ok({ settings }),
    ...routes,
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>
      <UiShellProvider>
        <SessionProvider api={transport.api} sessionStore={transport.sessionStore}>
          <ProjectsProvider>{children}</ProjectsProvider>
        </SessionProvider>
      </UiShellProvider>
    </NotificationProvider>
  );
  const { result } = renderHook(
    () => ({
      ...useProjectsContext(),
      settings: useSessionContext().settings,
      startSession: useSessionContext().startSession,
      modalsOpen: useUiShellContext().modalsOpen,
      alerts: useNotificationContext().alerts.map((alert) => alert.msg),
    }),
    { wrapper },
  );
  const projectRequests = () =>
    transport.requests.filter((request) => request.path === "/api/project");
  return { result, projectRequests, ...transport };
};

type Projects = ReturnType<typeof renderProjects>["result"];

const signIn = async (
  result: Projects,
  projects: ProjectInterface[],
  settings: Record<string, unknown> = { _id: "set1", currentProject: null },
) => {
  await act(async () => {
    const account = result.current.startSession({
      user: { _id: "u1", username: "owner", settings, projects },
    });
    result.current.openProjects(account);
  });
};

// answers every project action with the project it names, the SHARE action with a share
const projectRoute: Routes[string] = ({ action, project: sent }) =>
  ok({
    project: {
      ...project(sent._id ?? "new"),
      ...sent,
      notes: [],
      share: action === ProjectApiActions.SHARE ? share : undefined,
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("projectsContext open", () => {
  it("loads the last project when none is stored and saves it as current", async () => {
    const { result, projectRequests } = renderProjects({ "/api/project": projectRoute });

    await signIn(result, [project("p1"), project("p2")]);

    await waitFor(() => expect(result.current.project?._id).toBe("p2"));
    expect(projectRequests()[0].body).toMatchObject({ action: "GET", project: { _id: "p2" } });
    await waitFor(() => expect(result.current.settings.currentProject).toBe("p2"));
    expect(result.current.alerts).toContain("CUT P2");
    expect(result.current.projectsExist).toBe(true);
  });

  it("loads the stored current project", async () => {
    const { result } = renderProjects({ "/api/project": projectRoute });

    await signIn(result, [project("p1"), project("p2")], { _id: "set1", currentProject: "p1" });

    await waitFor(() => expect(result.current.project?._id).toBe("p1"));
  });

  it("welcomes a signed-in user with no projects", async () => {
    const { result } = renderProjects();

    await signIn(result, []);

    expect(result.current.modalsOpen).toEqual([ModalType.WELCOME]);
    expect(result.current.alerts).toContain("Create a project to start");
    expect(result.current.projectsExist).toBe(false);
  });

  it("asks for a video source when the loaded project has none", async () => {
    const { result } = renderProjects({
      "/api/project": () => ok({ project: project("p1", { src: "" }) }),
    });

    await signIn(result, [project("p1", { src: "" })]);

    await waitFor(() => expect(result.current.modalsOpen).toEqual([ModalType.CURRENT_PROJECT]));
  });

  it("shows a shared project on its own", () => {
    const { result } = renderProjects();

    act(() => result.current.showSharedProject(project("p1", { share })));

    expect(result.current.projects.map((p) => p._id)).toEqual(["p1"]);
    expect(result.current.project).toMatchObject({ _id: "p1", share });
    expect(result.current.alerts).toContain("CUT P1");
  });
});

describe("projectsContext changes", () => {
  it("creates a project, selects it and saves it as current", async () => {
    const { result, projectRequests } = renderProjects({ "/api/project": projectRoute });
    await signIn(result, []);

    await act(async () => {
      await result.current.createProject({ title: "Fresh", src: "f.mp4" });
    });

    expect(projectRequests().at(-1).body).toMatchObject({
      action: "CREATE",
      project: { title: "Fresh", src: "f.mp4" },
    });
    expect(result.current.project).toMatchObject({ title: "Fresh" });
    expect(result.current.projects).toHaveLength(1);
    await waitFor(() => expect(result.current.settings.currentProject).toBe("new"));
  });

  it("updates the current project and keeps its loaded notes", async () => {
    const notes = [{ _id: "n1", content: "Trim", time: 3, project: "p1" }];
    const { result } = renderProjects({
      "/api/project": ({ action, project: sent }) =>
        ok({
          project: action === "GET" ? project("p1", { notes }) : { ...project("p1"), ...sent },
        }),
    });
    await signIn(result, [project("p1")]);
    await waitFor(() => expect(result.current.project?.notes).toEqual(notes));

    await act(async () => {
      await result.current.updateProject({ ...project("p1"), title: "Final" });
    });

    expect(result.current.project).toMatchObject({ _id: "p1", title: "Final", notes });
    expect(result.current.projects[0]).toMatchObject({ title: "Final", notes });
  });

  it("updates from a closure made before the session started, as hydration does", async () => {
    const { result, projectRequests } = renderProjects({ "/api/project": projectRoute });
    act(() => result.current.showSharedProject(project("p1")));
    const updateFromEarlierRender = result.current.updateProject;

    await act(async () => {
      result.current.startSession({ user: { _id: "u1", username: "owner", projects: [] } });
      await updateFromEarlierRender({ ...project("p1"), title: "Final" });
    });

    expect(projectRequests().at(-1)?.body).toMatchObject({
      action: "UPDATE",
      project: { _id: "p1" },
    });
  });

  it("does not update projects for a guest", async () => {
    const { result, requests } = renderProjects({ "/api/project": projectRoute });

    await act(async () => {
      await result.current.updateProject({ src: "" });
    });

    expect(requests).toEqual([]);
  });

  it("removing the current project loads the last one left", async () => {
    const { result } = renderProjects({ "/api/project": projectRoute });
    await signIn(result, [project("p1"), project("p2")]);
    await waitFor(() => expect(result.current.settings.currentProject).toBe("p2"));

    await act(async () => {
      await result.current.removeProject("p2");
    });

    expect(result.current.projects.map((p) => p._id)).toEqual(["p1"]);
    await waitFor(() => expect(result.current.project?._id).toBe("p1"));
  });

  it("keeps the projects list and the current project in step with the note list", async () => {
    const { result } = renderProjects({ "/api/project": projectRoute });
    await signIn(result, [project("p1")]);
    await waitFor(() => expect(result.current.project?._id).toBe("p1"));
    const notes = [{ _id: "n2", content: "Grade", time: 9, project: "p1" }];

    await act(async () => {
      await result.current.updateProjectsStateWithUpdatedNotes(notes);
    });

    expect(result.current.projects[0].notes).toEqual(notes);
    expect(result.current.project.notes).toEqual(notes);
  });
});

describe("projectsContext sharing", () => {
  it("shareProject sends the SHARE action and reports whether the share matches", async () => {
    const { result, projectRequests } = renderProjects({ "/api/project": projectRoute });
    await signIn(result, [project("p1")]);
    await waitFor(() => expect(result.current.project?._id).toBe("p1"));

    let matched: boolean;
    await act(async () => {
      matched = await result.current.shareProject({ url: "rough-cut", canEdit: true });
    });

    expect(projectRequests().at(-1).body).toMatchObject({
      action: "SHARE",
      project: { _id: "p1" },
      share: { url: "rough-cut", canEdit: true },
    });
    expect(matched).toBe(true);
    expect(result.current.project.share).toEqual(share);
  });

  it("removeShareProject sends the REMOVE SHARE action with the share id", async () => {
    const { result, projectRequests } = renderProjects({ "/api/project": projectRoute });
    await signIn(result, [project("p1")]);
    await waitFor(() => expect(result.current.project?._id).toBe("p1"));
    await act(async () => {
      await result.current.shareProject({ url: "rough-cut", canEdit: true });
    });

    let removed: boolean;
    await act(async () => {
      removed = await result.current.removeShareProject();
    });

    expect(projectRequests().at(-1).body).toMatchObject({
      action: "REMOVE SHARE",
      project: { _id: "p1" },
      share: { _id: "s1" },
    });
    expect(removed).toBe(true);
    expect(result.current.project.share).toBeUndefined();
  });
});
