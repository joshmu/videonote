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

// upsertNote calls Note.findById twice: first for the existing-doc lookup
// (returns null on the create path, the doc on the update path), then for
// the populated reload. Tests prime the first call via `lookup`; the second
// always resolves to `populatedNote`.
const primeFindById = (lookup: unknown) => {
  vi.mocked(Note.findById).mockReset();
  vi.mocked(Note.findById)
    .mockReturnValueOnce(lookup as never)
    .mockReturnValue({
      populate: vi.fn().mockResolvedValue(populatedNote),
    } as never);
};

beforeEach(() => {
  primeFindById(null);
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

  it("omits the user field when authorId is null (guest path)", async () => {
    await upsertNote(buildNoteInput(), null);

    const constructed = vi.mocked(Note).mock.calls[0]![0] as Record<string, unknown>;
    expect("user" in constructed).toBe(false);
  });

  it("sets user to the supplied authorId, ignoring any user field in the input", async () => {
    await upsertNote(buildNoteInput({ user: "stale-from-client" }) as never, "u1");

    const constructed = vi.mocked(Note).mock.calls[0]![0] as Record<string, unknown>;
    expect(constructed.user).toBe("u1");
  });

  it("propagates a Project.findById failure (no orphan project save)", async () => {
    const projectDoc = buildProjectDoc();
    vi.mocked(Project.findById).mockResolvedValue(projectDoc as never);
    vi.mocked(Project.findById).mockImplementationOnce(() => {
      throw new Error("project lookup failed");
    });

    await expect(upsertNote(buildNoteInput(), "u1")).rejects.toThrow("project lookup failed");
    expect(projectDoc.save).not.toHaveBeenCalled();
  });
});

type FakeNoteDoc = {
  _id: string;
  updateOne: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
};

const buildExistingNoteDoc = (overrides: Partial<FakeNoteDoc> = {}): FakeNoteDoc => ({
  _id: "n1",
  updateOne: vi.fn().mockResolvedValue(undefined),
  save: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe("upsertNote — update path (existing _id)", () => {
  it("updates the existing note via updateOne+save, never constructs a new Note, and leaves Project.notes alone", async () => {
    const existingDoc = buildExistingNoteDoc();
    primeFindById(existingDoc);
    const projectDoc = buildProjectDoc();
    vi.mocked(Project.findById).mockResolvedValue(projectDoc as never);

    const result = await upsertNote(buildNoteInput({ content: "edited" }), "u1");

    expect(existingDoc.updateOne).toHaveBeenCalledWith({
      $set: expect.objectContaining({ content: "edited", user: "u1" }),
    });
    expect(existingDoc.save).toHaveBeenCalledTimes(1);
    expect(Note).not.toHaveBeenCalled();
    expect(projectDoc.save).not.toHaveBeenCalled();
    expect(result).toBe(populatedNote);
  });

  it("does not touch the user field on $set when authorId is null (guest editing)", async () => {
    const existingDoc = buildExistingNoteDoc();
    primeFindById(existingDoc);

    await upsertNote(buildNoteInput({ content: "edited" }), null);

    const [{ $set }] = vi.mocked(existingDoc.updateOne).mock.calls[0]! as [
      { $set: Record<string, unknown> },
    ];
    expect("user" in $set).toBe(false);
  });
});
