import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/utils/mongoose", () => {
  // `new Note(doc)` returns an object with the doc fields plus a stubbed
  // save(). The constructor itself is a vi.fn so we can assert what it
  // was called with.
  const NoteCtor = vi.fn(function (this: Record<string, unknown>, doc: Record<string, unknown>) {
    Object.assign(this, doc);
    (this as { save: () => Promise<void> }).save = vi.fn().mockResolvedValue(undefined);
  });
  return {
    Note: Object.assign(NoteCtor, {
      findById: vi.fn(),
      find: vi.fn(),
      deleteMany: vi.fn(),
    }),
    Project: { findById: vi.fn() },
  };
});

import { Note, Project } from "@/utils/mongoose";
import { upsertNote } from "@/utils/note/noteIntake";

type FakeProjectDoc = {
  _id: string;
  notes: string[];
  save: ReturnType<typeof vi.fn>;
};

const buildNoteInput = (overrides: Record<string, unknown> = {}) => ({
  _id: "n1",
  content: "hello",
  time: 12,
  done: false,
  project: "p1",
  ...overrides,
});

const buildProjectDoc = (overrides: Partial<FakeProjectDoc> = {}): FakeProjectDoc => ({
  _id: "p1",
  notes: [],
  save: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const populatedNote = {
  _id: "n1",
  content: "hello",
  time: 12,
  done: false,
  project: "p1",
  user: { _id: "u1", username: "alice", email: "a@a" },
};

const mockReloadWithAuthor = () => {
  vi.mocked(Note.findById).mockReturnValue({
    populate: vi.fn().mockResolvedValue(populatedNote),
  } as never);
};

beforeEach(() => {
  mockReloadWithAuthor();
  vi.mocked(Project.findById).mockResolvedValue(buildProjectDoc() as never);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("upsertNote — create path (no existing _id)", () => {
  it("creates a new Note from the input, links it to the project, and returns the populated doc", async () => {
    const projectDoc = buildProjectDoc();
    vi.mocked(Project.findById).mockResolvedValue(projectDoc as never);

    const result = await upsertNote(buildNoteInput(), "u1");

    expect(Note).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: "n1",
        content: "hello",
        time: 12,
        done: false,
        project: "p1",
        user: "u1",
      }),
    );
    expect(projectDoc.notes).toEqual(["n1"]);
    expect(projectDoc.save).toHaveBeenCalledTimes(1);
    expect(result).toBe(populatedNote);
  });
});
