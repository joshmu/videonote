import { isObjectIdOrHexString, type Types } from "mongoose";

import type { NoteInterface } from "@/shared/types";
import { Note, type NoteDoc, Project, type ProjectDoc } from "@/utils/mongoose";
import { mayEditViaShare, type PublicAuthor, toPublicAuthor } from "@/utils/share/shareAccess";

/** A malformed Note or Project id, or a Note field the schema would reject. */
type Invalid = { kind: "invalid" };
type Denied =
  | Invalid
  | { kind: "notFound" }
  | { kind: "forbidden" }
  | { kind: "sharePasswordRequired" };
/** A written Note as returned to the caller: the author is the public view only. */
export type WrittenNote = Omit<ReturnType<NoteDoc["toObject"]>, "user"> & { user?: PublicAuthor };
export type UpsertNoteResult = { kind: "ok"; note: WrittenNote } | Denied;
export type RemoveDoneNotesResult = { kind: "ok"; notes: WrittenNote[] } | Denied;

/**
 * Upsert a Note for `callerId` (a User._id, or `null` for a guest), who may
 * send the `shareToken` a password-protected Share needs. Creates
 * when no Note has `input._id`, else updates `content`, `time` and `done`;
 * `project` and `user` never change on update. Permission comes from the
 * stored Note's Project on update and from `input.project` on create. A new
 * Note is authored by the caller and pushed onto `Project.notes`. Returns
 * the Note with its author as the public view (never an email). A malformed
 * Note id, Project id on create, or field is `invalid`; a missing Note id
 * creates, and a new Note needs non-empty `content`. A missing or null
 * `time` is 0 on create and leaves the time unchanged on update.
 */
export const upsertNote = async (
  input: NoteInterface,
  callerId: string | null,
  shareToken?: unknown,
): Promise<UpsertNoteResult> => {
  if (input._id !== undefined && !isIdString(input._id)) return INVALID;
  // A null time counts as absent: 0 (the schema default) on create, unchanged on update.
  const time = input.time ?? undefined;
  const editable = pickDefined({ content: input.content, time, done: input.done });
  const existing = await Note.findById(input._id);
  if (!existing && !isIdString(input.project)) return INVALID;
  if (!isValidEdit(editable, !existing)) return INVALID;
  const access = await checkWriteAccess(
    existing ? existing.project : input.project,
    callerId,
    shareToken,
  );
  if (access.kind !== "allowed") return access;

  if (existing) {
    existing.set(editable);
    await existing.save();
    return { kind: "ok", note: await reloadForCaller(existing._id, access.projectDoc.user) };
  }

  const noteDoc = await Note.create({
    _id: input._id,
    ...editable,
    project: access.projectDoc._id,
    ...(callerId !== null && { user: callerId }),
  });
  await Project.updateOne({ _id: access.projectDoc._id }, { $push: { notes: noteDoc._id } });
  return { kind: "ok", note: await reloadForCaller(noteDoc._id, access.projectDoc.user) };
};

/**
 * Delete every done Note in the Project, pull them from `Project.notes` and
 * return the survivors, their authors as the public view. Same write policy
 * as {@link upsertNote}; a malformed or missing project id is `invalid`.
 */
export const removeDoneProjectNotes = async (
  projectId: unknown,
  callerId: string | null,
  shareToken?: unknown,
): Promise<RemoveDoneNotesResult> => {
  if (!isIdString(projectId)) return INVALID;
  const access = await checkWriteAccess(projectId, callerId, shareToken);
  if (access.kind !== "allowed") return access;

  const { _id } = access.projectDoc;
  const done = await Note.find({ project: _id, done: true }, "_id").lean();
  const doneIds = done.map((note) => note._id);
  await Note.deleteMany({ _id: { $in: doneIds } });
  await Project.updateOne({ _id }, { $pull: { notes: { $in: doneIds } } });
  return { kind: "ok", notes: await findProjectNotes(access.projectDoc) };
};

const INVALID: Invalid = { kind: "invalid" };

// Only a hex string: isObjectIdOrHexString also passes objects that claim to be ObjectIds.
const isIdString = (value: unknown): value is string =>
  typeof value === "string" && isObjectIdOrHexString(value);

// Mirrors the Note schema, so a bad field is `invalid` rather than a failed save.
const isValidEdit = (
  { content, time, done }: { content?: unknown; time?: unknown; done?: unknown },
  creating: boolean,
): boolean =>
  (content === undefined ? !creating : typeof content === "string" && content !== "") &&
  (time === undefined || (typeof time === "number" && Number.isFinite(time))) &&
  (done === undefined || typeof done === "boolean");

// Note write policy: the Project owner always; anyone else only through the
// Project's Share (see mayEditViaShare). `projectId` is already checked.
const checkWriteAccess = async (
  projectId: unknown,
  callerId: string | null,
  shareToken: unknown,
): Promise<{ kind: "allowed"; projectDoc: ProjectDoc } | Denied> => {
  const projectDoc = await Project.findById(projectId);
  if (!projectDoc) return { kind: "notFound" };
  if (isOwner(projectDoc, callerId)) return { kind: "allowed", projectDoc };
  const viaShare = await mayEditViaShare(projectDoc, shareToken);
  if (viaShare.kind === "allowed") return { kind: "allowed", projectDoc };
  return viaShare.kind === "passwordRequired" ? { kind: "sharePasswordRequired" } : viaShare;
};

const isOwner = (projectDoc: ProjectDoc, callerId: string | null) =>
  callerId !== null && projectDoc.user.equals(callerId);

const pickDefined = <T extends Record<string, unknown>>(fields: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  ) as Partial<T>;

// Populates the email only so toPublicAuthor can apply its username rule.
const AUTHOR_FIELDS = "username email";

const withPublicAuthor = (noteDoc: NoteDoc, ownerId: Types.ObjectId): WrittenNote => {
  const { user, ...note } = noteDoc.toObject();
  const author = toPublicAuthor(user, ownerId);
  return { ...note, ...(author && { user: author }) };
};

const findProjectNotes = async ({ _id, user }: ProjectDoc): Promise<WrittenNote[]> => {
  const notes = await Note.find({ project: _id }).populate("user", AUTHOR_FIELDS);
  return notes.map((note) => withPublicAuthor(note, user));
};

const reloadForCaller = async (noteId: unknown, ownerId: Types.ObjectId): Promise<WrittenNote> =>
  withPublicAuthor((await Note.findById(noteId).populate("user", AUTHOR_FIELDS))!, ownerId);
