import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ProjectInterface } from "@/components/shared/types";
import { GlobalProvider, useGlobalContext } from "@/context/globalContext";
import { NoteProvider, useNoteContext } from "@/context/noteContext";

const mocks = vi.hoisted(() => ({ addAlert: vi.fn(), push: vi.fn() }));

vi.mock("@/context/notificationContext", () => ({
  useNotificationContext: () => ({ addAlert: mocks.addAlert }),
}));
vi.mock("next/router", () => ({ default: { push: mocks.push } }));
vi.mock("@/context/videoContext", () => ({
  useVideoContext: () => ({ progress: { playedSeconds: 0 } }),
}));

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

const signedInData = (settings: Record<string, unknown>) => ({
  user: {
    _id: "u1",
    username: "owner",
    email: "owner@example.com",
    settings,
    projects: [{ ...sharedProject, share: undefined }],
  },
});

describe("globalContext removeAccount", () => {
  const renderSignedIn = async (reply: { status: number; body: unknown }) => {
    vi.stubGlobal("fetch", fetchStub({ "/api/user": () => reply }));
    await act(async () => {
      renderGlobal({
        user: { _id: "u1", username: "owner", email: "owner@example.com", projects: [] },
      });
    });
    vi.clearAllMocks();
    await act(async () => {
      await ctx.removeAccount({ ...ctx.user, password: "secret" });
    });
  };

  it("shows a wrong password without ending the session", async () => {
    await renderSignedIn({ status: 401, body: { msg: "Password is incorrect." } });

    expect(mocks.addAlert).toHaveBeenCalledWith({ type: "error", msg: "Password is incorrect." });
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("sends an expired session to login", async () => {
    await renderSignedIn({ status: 401, body: { msg: "Invalid token" } });

    expect(mocks.push).toHaveBeenCalledWith("/login");
  });
});

describe("globalContext admin", () => {
  it("starts as a guest until the account is loaded", async () => {
    const seen: boolean[] = [];
    const Recorder = () => {
      seen.push(useGlobalContext().admin);
      return null;
    };
    vi.stubGlobal("fetch", fetchStub());

    await act(async () => {
      render(
        <GlobalProvider serverData={{ share: { kind: "ok", project: sharedProject } }}>
          <Recorder />
        </GlobalProvider>,
      );
    });

    expect(seen[0]).toBe(false);
    expect(seen.every((admin) => admin === false)).toBe(true);
  });

  it("saves the loaded project in the settings of a signed-in user", async () => {
    const fetch = fetchStub({
      "/api/project": () => ({
        status: 200,
        body: { project: { ...sharedProject, share: undefined } },
      }),
      "/api/settings": ({ settings }) => ({ status: 200, body: { settings } }),
    });
    vi.stubGlobal("fetch", fetch);

    await act(async () => {
      renderGlobal(signedInData({ _id: "set1", currentProject: null }));
    });

    await waitFor(() => expect(ctx.settings.currentProject).toBe("p1"));
    expect(ctx.admin).toBe(true);
  });
});

describe("globalContext project notes", () => {
  it("replaces the current project's notes without mutating the previous project", async () => {
    vi.stubGlobal(
      "fetch",
      fetchStub({
        "/api/project": () => ({
          status: 200,
          body: { project: { ...sharedProject, share: undefined } },
        }),
        "/api/settings": ({ settings }) => ({ status: 200, body: { settings } }),
      }),
    );
    await act(async () => {
      renderGlobal(signedInData({ _id: "set1", currentProject: "p1" }));
    });
    await waitFor(() => expect(ctx.project?._id).toBe("p1"));
    const previous = ctx.projects[0];
    const previousNotes = previous.notes;
    const notes = [...previousNotes, { _id: "n2", content: "Grade", time: 9, project: "p1" }];

    await act(async () => {
      await ctx.updateProjectsStateWithUpdatedNotes(notes);
    });

    expect(previous.notes).toBe(previousNotes);
    expect(ctx.projects[0].notes).toEqual(notes);
    expect(ctx.project.notes).toEqual(notes);
  });

  it("keeps the current project's notes in step when a note is added", async () => {
    vi.stubGlobal(
      "fetch",
      fetchStub({
        "/api/project": () => ({
          status: 200,
          body: { project: { ...sharedProject, share: undefined } },
        }),
        "/api/settings": ({ settings }) => ({ status: 200, body: { settings } }),
        "/api/note": ({ note }) => ({ status: 200, body: { note } }),
      }),
    );
    let notesCtx: ReturnType<typeof useNoteContext>;
    const NotesProbe = () => {
      notesCtx = useNoteContext();
      return null;
    };
    await act(async () => {
      render(
        <GlobalProvider serverData={signedInData({ _id: "set1", currentProject: "p1" })}>
          <NoteProvider>
            <Probe />
            <NotesProbe />
          </NoteProvider>
        </GlobalProvider>,
      );
    });
    await waitFor(() => expect(notesCtx.notes).toHaveLength(1));

    await act(async () => {
      notesCtx.addNote({ content: "Grade", time: 9 });
    });

    expect(notesCtx.notes.map((n) => n.content)).toEqual(["Trim", "Grade"]);
    expect(ctx.project.notes.map((n) => n.content)).toEqual(["Trim", "Grade"]);
    expect(ctx.projects[0].notes).toHaveLength(2);
  });
});
