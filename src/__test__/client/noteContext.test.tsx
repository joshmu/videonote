import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { NoteInterface } from "@/components/shared/types";
import { NoteProvider, useNoteContext } from "@/context/noteContext";

const mocks = vi.hoisted(() => {
  const project = {
    _id: "p1",
    title: "Project",
    user: "u1",
    notes: [
      { _id: "a", content: "first", time: 20, done: false },
      { _id: "b", content: "second", time: 10, done: false },
    ],
  };
  return {
    global: {
      project,
      projects: [project],
      user: { _id: "u1" },
      noteApi: vi.fn(),
      noteApiRemoveDoneNotes: vi.fn(),
      updateProjectsStateWithUpdatedNotes: vi.fn(),
      checkCanEdit: () => true,
    },
  };
});

vi.mock("@/context/globalContext", () => ({
  useGlobalContext: () => mocks.global,
}));

vi.mock("@/context/videoContext", () => ({
  useVideoContext: () => ({ progress: { playedSeconds: 0 } }),
}));

let ctx: ReturnType<typeof useNoteContext>;
const Probe = () => {
  ctx = useNoteContext();
  return null;
};

const renderNotes = () =>
  render(
    <NoteProvider>
      <Probe />
    </NoteProvider>,
  );

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
    mocks.global.noteApiRemoveDoneNotes.mockResolvedValue("error");
    renderNotes();

    await act(async () => {
      await ctx.removeCompleted();
    });

    expect(Array.isArray(ctx.notes)).toBe(true);
    expect(ctx.notes.map((n) => n._id)).toEqual(["a", "b"]);
  });

  it("keeps notes added while an update is in flight", async () => {
    const update = deferred<NoteInterface | "error">();
    mocks.global.noteApi
      .mockReturnValueOnce(update.promise)
      .mockReturnValueOnce(new Promise(() => {}));
    renderNotes();

    act(() => {
      ctx.updateNote({ ...ctx.notes[0], done: true });
    });
    act(() => {
      ctx.addNote({ content: "added", time: 30 });
    });
    await act(async () => {
      update.resolve({ _id: "a", content: "first", time: 20, done: true });
    });

    expect(ctx.notes.map((n) => n.content)).toEqual(["first", "second", "added"]);
    expect(ctx.notes[0].done).toBe(true);
  });

  it("sorts without reordering the notes state", () => {
    renderNotes();
    const notes = ctx.notes;

    const sorted = ctx.sort(notes);

    expect(sorted.map((n) => n._id)).toEqual(["b", "a"]);
    expect(notes.map((n) => n._id)).toEqual(["a", "b"]);
  });
});
