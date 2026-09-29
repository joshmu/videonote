import { isValidObjectId, type Types } from "mongoose";

import type { NoteInterface } from "@/shared/types";
import { Note, type NoteDoc, Project, type ProjectDoc } from "@/utils/mongoose";
import { mayEditViaShare } from "@/utils/share/shareAccess";

type Denied = { kind: "notFound" } | { kind: "forbidden" };
export type UpsertNoteResult = { kind: "ok"; note: NoteDoc } | Denied;
export type RemoveDoneNotesResult =
  | { kind: "ok"; notes: Awaited<ReturnType<typeof findProjectNotes>> }
  | Denied;

/**
 * Upsert a Note for `callerId` (a User._id, or `null` for a guest). Creates
 * when no Note has `input._id`, else updates `content`, `time` and `done`;
 * `project` and `user` never change on update. Permission comes from the
 * stored Note's Project on update and from `input.project` on create. A new
 * Note is authored by the caller and pushed onto `Project.notes`. Returns
 * the Note re-loaded with its author User populated.
 */
export const upsertNote = async (
  input: NoteInterface,
  callerId: string | null,
): Promise<UpsertNoteResult> => {
  const existing = await Note.findById(input._id);
  const access = await checkWriteAccess(existing ? existing.project : input.project, callerId);
  if (access.kind !== "allowed") return access;

  const editable = pickDefined({ content: input.content, time: input.time, done: input.done });

  if (existing) {
    existing.set(editable);
    await existing.save();
    return { kind: "ok", note: await reloadWithAuthor(existing._id) };
  }

  const noteDoc = await Note.create({
    _id: input._id,
    ...editable,
    project: access.projectDoc._id,
    ...(callerId !== null && { user: callerId }),
  });
  await Project.updateOne({ _id: access.projectDoc._id }, { $push: { notes: noteDoc._id } });
  return { kind: "ok", note: await reloadWithAuthor(noteDoc._id) };
};

/**
 * Delete every done Note in the Project, pull them from `Project.notes` and
 * return the survivors (lean). Same write policy as {@link upsertNote}.
 */
export const removeDoneProjectNotes = async (
  projectId: unknown,
  callerId: string | null,
): Promise<RemoveDoneNotesResult> => {
  const access = await checkWriteAccess(projectId, callerId);
  if (access.kind !== "allowed") return access;

  const { _id } = access.projectDoc;
  const done = await Note.find({ project: _id, done: true }, "_id").lean();
  const doneIds = done.map((note) => note._id);
  await Note.deleteMany({ _id: { $in: doneIds } });
  await Project.updateOne({ _id }, { $pull: { notes: { $in: doneIds } } });
  return { kind: "ok", notes: await findProjectNotes(_id) };
};

// Note write policy: the Project owner always; anyone else only through the
// Project's Share with canEdit.
const checkWriteAccess = async (
  projectId: unknown,
  callerId: string | null,
): Promise<{ kind: "allowed"; projectDoc: ProjectDoc } | Denied> => {
  const projectDoc = isValidObjectId(projectId) ? await Project.findById(projectId) : null;
  if (!projectDoc) return { kind: "notFound" };
  if (isOwner(projectDoc, callerId) || (await mayEditViaShare(projectDoc))) {
    return { kind: "allowed", projectDoc };
  }
  return { kind: "forbidden" };
};

const isOwner = (projectDoc: ProjectDoc, callerId: string | null) =>
  callerId !== null && projectDoc.user.equals(callerId);

const pickDefined = <T extends Record<string, unknown>>(fields: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  ) as Partial<T>;

const findProjectNotes = (projectId: Types.ObjectId) => Note.find({ project: projectId }).lean();

const reloadWithAuthor = async (noteId: unknown): Promise<NoteDoc> =>
  Note.findById(noteId).populate("user", "username email");
