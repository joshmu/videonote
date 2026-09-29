import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NoteItem } from "@/components/NoteList/NoteItem/NoteItem";
import { NoteApiAction, type NoteInterface } from "@/components/shared/types";
import { AppProviders } from "@/context/appProviders";
import { ControlsProvider } from "@/context/controlsContext";
import { NoteProvider, useNoteContext } from "@/context/noteContext";
import { NotificationProvider, useNotificationContext } from "@/context/notificationContext";
import { useUiShellContext } from "@/context/uiShellContext";
import { VideoProvider, useVideoContext } from "@/context/videoContext";

import { type Reply, type Routes, fakeTransport, ok } from "./providerHarness";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/router", () => ({ default: { push: mocks.push } }));
// A .js file with JSX, which the test transform does not parse.
vi.mock("@/shared/TimeDisplay/TimeDisplay", () => ({ default: () => null }));

const project = {
  _id: "p1",
  title: "Project",
  src: "https://example.com/v.mp4",
  user: "u1",
  notes: [
    { _id: "a", content: "first", time: 20, done: false, project: "p1" },
    { _id: "b", content: "second", time: 10, done: false, project: "p1" },
  ],
};

const signedIn = {
  user: {
    _id: "u1",
    username: "owner",
    settings: { _id: "set1", currentProject: "p1" },
    projects: [project],
  },
};

let ctx: ReturnType<typeof useNoteContext>;
let shell: ReturnType<typeof useUiShellContext>;
let prompt: ReturnType<typeof useUiShellContext>["promptState"];
let alerts: string[];
let video: ReturnType<typeof useVideoContext>;
const Probe = () => {
  ctx = useNoteContext();
  shell = useUiShellContext();
  prompt = shell.promptState;
  alerts = useNotificationContext().alerts.map((alert) => String(alert.msg));
  video = useVideoContext();
  return null;
};

// The note rows as the sidebar renders them.
const Rows = () => (
  <>
    {useNoteContext().notes.map((note) => (
      <NoteItem key={note._id} note={note} closestProximity={false} childVariants={{}} />
    ))}
  </>
);

const renderNotes = async (note: Routes[string], rows = false) => {
  const transport = fakeTransport({
    "/api/project": () => ok({ project }),
    "/api/settings": ({ settings }) => ok({ settings }),
    "/api/note": note,
  });
  await act(async () => {
    render(
      <NotificationProvider>
        <AppProviders
          serverData={signedIn}
          api={transport.api}
          sessionStore={transport.sessionStore}
        >
          <VideoProvider>
            <NoteProvider>
              <Probe />
              {rows && (
                <ControlsProvider>
                  <Rows />
                </ControlsProvider>
              )}
            </NoteProvider>
          </VideoProvider>
        </AppProviders>
      </NotificationProvider>,
    );
  });
  await waitFor(() => expect(ctx.notes).toHaveLength(2));
  return transport;
};

const editRow = async (from: string, to: string) => {
  fireEvent.doubleClick(screen.getByText(from));
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: to } });
  await act(async () => fireEvent.blur(input));
};

const noteRequests = (requests: ReturnType<typeof fakeTransport>["requests"]) =>
  requests.filter((request) => request.path === "/api/note");

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("noteContext", () => {
  it("keeps the notes when removing done notes fails", async () => {
    await renderNotes(() => ({ status: 500, body: { msg: "Database error" } }));

    await act(async () => {
      await ctx.removeCompleted();
    });

    expect(Array.isArray(ctx.notes)).toBe(true);
    expect(ctx.notes.map((n) => n._id)).toEqual(["a", "b"]);
  });

  it("removes done notes through the note route and keeps the survivors", async () => {
    const { requests } = await renderNotes(() => ok({ notes: [project.notes[1]] }));

    await act(async () => {
      await ctx.removeCompleted();
    });

    expect(noteRequests(requests).at(-1).body).toEqual({
      action: NoteApiAction.REMOVE_DONE_NOTES,
      projectId: "p1",
    });
    expect(ctx.notes.map((n) => n._id)).toEqual(["b"]);
  });

  it("keeps notes added while an update is in flight", async () => {
    const update = deferred<Reply>();
    const replies = [update.promise, new Promise<Reply>(() => {})];
    await renderNotes(() => replies.shift());

    act(() => {
      ctx.updateNote({ ...ctx.notes[0], done: true });
    });
    act(() => {
      ctx.addNote({ content: "added", time: 30 });
    });
    await act(async () => {
      update.resolve(ok({ note: { _id: "a", content: "first", time: 20, done: true } }));
    });

    expect(ctx.notes.map((n) => n.content)).toEqual(["first", "second", "added"]);
    expect(ctx.notes[0].done).toBe(true);
  });

  it.each([
    ["a null time", null],
    ["a non-finite time", Number.NaN],
    ["no time", undefined],
  ])("sends time 0 for a note with %s before the player reports progress", async (_l, time) => {
    const { requests } = await renderNotes(({ note }) =>
      typeof note.time === "number"
        ? ok({ note })
        : { status: 400, body: { msg: "Invalid note." } },
    );

    await act(async () => {
      ctx.addNote({ content: "added", time });
    });

    expect(noteRequests(requests)[0].body.note.time).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(ctx.notes.map((n) => n.content)).toEqual(["first", "second", "added"]);
  });

  it("sends the player position for a note with no time of its own", async () => {
    const { requests } = await renderNotes(({ note }) => ok({ note }));
    act(() => {
      video.handleProgress({ playedSeconds: 7, played: 0.1, loadedSeconds: 7, loaded: 0.1 });
    });

    await act(async () => {
      ctx.addNote({ content: "added", time: null });
    });

    expect(noteRequests(requests)[0].body.note.time).toBe(7);
  });

  it("gives a new note an ObjectId-shaped id and keeps it after the server accepts it", async () => {
    const { requests } = await renderNotes(({ note }) => ok({ note }));

    await act(async () => {
      ctx.addNote({ content: "added", time: 30 });
    });

    const sent = noteRequests(requests)[0].body.note as NoteInterface;
    expect(sent._id).toMatch(/^[0-9a-f]{24}$/);
    expect(ctx.notes.map((n) => n._id)).toContain(sent._id);
  });

  it("drops a new note the server rejects", async () => {
    await renderNotes(() => ({ status: 403, body: { msg: "Forbidden" } }));

    await act(async () => {
      ctx.addNote({ content: "added", time: 30 });
    });

    await waitFor(() => expect(ctx.notes.map((n) => n._id)).toEqual(["a", "b"]));
  });

  it("sends an expired session to login when a note save is unauthorized", async () => {
    await renderNotes(() => ({ status: 401, body: { msg: "Invalid token" } }));

    await act(async () => {
      ctx.addNote({ content: "added", time: 30 });
    });

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/login"));
  });

  it("restores the saved content when the server rejects an edit", async () => {
    await renderNotes(() => ({ status: 400, body: { msg: "Invalid note." } }), true);

    await editRow("first", "renamed");

    await waitFor(() => expect(screen.getByText("first")).toBeInTheDocument());
    expect(screen.queryByText("renamed")).not.toBeInTheDocument();
  });

  it.each([
    ["empty", ""],
    ["blank", "   "],
  ])("does not submit %s content from the editor and keeps the saved content", async (_l, to) => {
    const { requests } = await renderNotes(({ note }) => ok({ note }), true);

    await editRow("first", to);

    expect(noteRequests(requests)).toHaveLength(0);
    expect(screen.getByText("first")).toBeInTheDocument();
  });

  it("shows the saved content after the server accepts an edit", async () => {
    const { requests } = await renderNotes(({ note }) => ok({ note }), true);

    await editRow("first", "renamed");

    await waitFor(() => expect(ctx.notes[0].content).toBe("renamed"));
    expect(noteRequests(requests)).toHaveLength(1);
    expect(screen.getByText("renamed")).toBeInTheDocument();
  });

  it("sorts without reordering the notes state", async () => {
    await renderNotes(({ note }) => ok({ note }));
    const notes = ctx.notes;

    const sorted = ctx.sort(notes);

    expect(sorted.map((n) => n._id)).toEqual(["b", "a"]);
    expect(notes.map((n) => n._id)).toEqual(["a", "b"]);
  });
});

describe("noteContext on a password-protected Share", () => {
  const shared = { ...project, share: { _id: "s1", url: "rough-cut", canEdit: true } };

  const renderGuest = async (note: Routes[string]) => {
    const tokens = ["share-1", "share-2"];
    const transport = fakeTransport(
      {
        "/api/public_project": () =>
          ok({ user: { projects: [shared] }, shareToken: tokens.shift() }),
        "/api/note": note,
      },
      undefined,
    );
    await act(async () => {
      render(
        <NotificationProvider>
          <AppProviders
            serverData={{ share: { kind: "passwordRequired" } }}
            api={transport.api}
            sessionStore={transport.sessionStore}
          >
            <VideoProvider>
              <NoteProvider>
                <Probe />
              </NoteProvider>
            </VideoProvider>
          </AppProviders>
        </NotificationProvider>,
      );
    });
    await act(async () => prompt.action({ password: "hunter2" }));
    await waitFor(() => expect(ctx.notes).toHaveLength(2));
    return transport;
  };

  beforeEach(() => {
    window.history.pushState({}, "", "/vn/rough-cut");
  });

  it("sends the Share token with note writes", async () => {
    const { requests } = await renderGuest(({ note }) => ok({ note }));

    await act(async () => {
      ctx.addNote({ content: "added", time: 30 });
    });

    expect(noteRequests(requests)[0]).toMatchObject({ shareToken: "share-1" });
  });

  it("keeps an unsent note, asks for the password again and resends it", async () => {
    const replies: Reply[] = [
      {
        status: 403,
        body: { msg: "Share password required.", code: "sharePasswordRequired" },
      },
    ];
    const { requests } = await renderGuest(({ note }) => replies.shift() ?? ok({ note }));

    await act(async () => {
      ctx.addNote({ content: "added", time: 30 });
    });

    await waitFor(() => expect(prompt.isOpen).toBe(true));
    expect(prompt.passwordRequired).toBe(true);
    expect(ctx.notes.map((n) => n.content)).toContain("added");

    await act(async () => shell.confirmPrompt({ password: "hunter2" }));

    await waitFor(() => expect(noteRequests(requests)).toHaveLength(2));
    expect(noteRequests(requests)[1]).toMatchObject({
      shareToken: "share-2",
      body: { note: expect.objectContaining({ content: "added" }) },
    });
    await waitFor(() => expect(ctx.notes.map((n) => n.content)).toContain("added"));
    expect(ctx.notes).toHaveLength(3);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("drops the unsent note and says so when the password prompt is dismissed", async () => {
    const { requests } = await renderGuest(() => ({
      status: 403,
      body: { msg: "Share password required.", code: "sharePasswordRequired" },
    }));

    await act(async () => {
      ctx.addNote({ content: "added", time: 30 });
    });
    await waitFor(() => expect(prompt.isOpen).toBe(true));
    act(() => shell.cancelPrompt());

    await waitFor(() => expect(ctx.notes.map((n) => n.content)).toEqual(["first", "second"]));
    expect(alerts).toContain("Not saved: the Share password is needed to edit notes.");
    expect(noteRequests(requests)).toHaveLength(1);
  });

  it("resends a note's create before its update once the password is given again", async () => {
    const resentCreate = deferred<Reply>();
    let first = true;
    const { requests } = await renderGuest(({ note }) => {
      if (first) {
        first = false;
        return {
          status: 403,
          body: { msg: "Share password required.", code: "sharePasswordRequired" },
        };
      }
      return note.done ? ok({ note }) : resentCreate.promise;
    });

    await act(async () => {
      ctx.addNote({ content: "added", time: 30 });
    });
    await waitFor(() => expect(prompt.isOpen).toBe(true));
    const added = ctx.notes.find((n) => n.content === "added");
    act(() => {
      ctx.updateNote({ ...added, done: true });
    });
    await act(async () => shell.confirmPrompt({ password: "hunter2" }));
    await waitFor(() => expect(noteRequests(requests)).toHaveLength(2));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(noteRequests(requests)).toHaveLength(2);
    expect(noteRequests(requests)[1].body.note).toMatchObject({ _id: added._id, done: false });

    await act(async () => {
      resentCreate.resolve(ok({ note: { ...added, currentSession: undefined } }));
    });

    await waitFor(() => expect(noteRequests(requests)).toHaveLength(3));
    expect(noteRequests(requests)[2].body.note).toMatchObject({ _id: added._id, done: true });
    await waitFor(() => expect(ctx.notes.find((n) => n._id === added._id)?.done).toBe(true));
  });
});
