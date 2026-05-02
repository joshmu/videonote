import type { NoteDocInterface, NoteInterface } from "@/shared/types";
import { Note, Project } from "@/utils/mongoose";

/**
 * Upsert a Note. Creates when no doc with `input._id` exists, updates
 * otherwise. On create, also pushes the new Note's _id onto
 * Project.notes so the Project↔Note lifecycle stays in one place.
 * Returns the Note doc reloaded with its author User populated
 * (`username email`). `authorId` is the caller's User._id, or `null`
 * for guests — guests skip authorship without this module knowing
 * about OptionalAuthContext.
 */
export const upsertNote = async (
  input: NoteInterface,
  authorId: string | null,
): Promise<NoteDocInterface> => {
  const { _id, ...rest } = input;
  const data: Partial<NoteInterface> = { ...rest };
  if (authorId !== null) data.user = authorId;

  const existing = await Note.findById(_id);
  if (existing) {
    await existing.updateOne({ $set: data });
    await existing.save();
    return reloadWithAuthor(existing._id);
  }

  const noteDoc = new Note({ _id, ...data });
  await noteDoc.save();

  const projectDoc = await Project.findById(noteDoc.project);
  projectDoc.notes.push(noteDoc._id);
  await projectDoc.save();

  return reloadWithAuthor(noteDoc._id);
};

/**
 * Delete every done Note in `projectId`; return the surviving notes
 * (lean). Caller owns any guest/auth policy.
 */
export const removeDoneProjectNotes = async (projectId: string): Promise<NoteInterface[]> => {
  await Note.deleteMany({ project: projectId, done: true });
  return Note.find({ project: projectId }).lean() as unknown as Promise<NoteInterface[]>;
};

const reloadWithAuthor = (noteId: unknown): Promise<NoteDocInterface> =>
  Note.findById(noteId).populate("user", "username email") as unknown as Promise<NoteDocInterface>;
