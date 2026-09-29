import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NoteApiAction, type NoteInterface } from "@/components/shared/types";
import { AppProviders } from "@/context/appProviders";
import { NoteProvider, useNoteContext } from "@/context/noteContext";
import { NotificationProvider } from "@/context/notificationContext";
import { VideoProvider } from "@/context/videoContext";

import { type Reply, type Routes, fakeTransport, ok } from "./providerHarness";

vi.mock("next/router", () => ({ default: { push: vi.fn() } }));

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
const Probe = () => {
  ctx = useNoteContext();
  return null;
};

const renderNotes = async (note: Routes[string]) => {
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
            </NoteProvider>
          </VideoProvider>
        </AppProviders>
      </NotificationProvider>,
    );
  });
  await waitFor(() => expect(ctx.notes).toHaveLength(2));
  return transport;
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

  it("sorts without reordering the notes state", async () => {
    await renderNotes(({ note }) => ok({ note }));
    const notes = ctx.notes;

    const sorted = ctx.sort(notes);

    expect(sorted.map((n) => n._id)).toEqual(["b", "a"]);
    expect(notes.map((n) => n._id)).toEqual(["a", "b"]);
  });
});
