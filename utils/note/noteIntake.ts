import { randomBytes } from "node:crypto";

import type { NoteInterface } from "@/shared/types";
import { isIdString } from "@/utils/ids";
import { mayEditViaShare, type PublicAuthor, toPublicAuthor } from "@/utils/share/shareAccess";
import { getStore, type Id, type NoteView, type ProjectRecord } from "@/utils/store";

/** A malformed Note or Project id, or a Note field the schema would reject. */
type Invalid = { kind: "invalid" };
type Denied =
  | Invalid
  | { kind: "notFound" }
  | { kind: "forbidden" }
  | { kind: "sharePasswordRequired" };
/** A written Note as returned to the caller: the author is the public view only. */
export type WrittenNote = {
  _id: Id;
  content: string;
  time: number;
  done: boolean;
  project: Id;
  user?: PublicAuthor;
  createdAt: Date;
  updatedAt: Date;
};
export type UpsertNoteResult = { kind: "ok"; note: WrittenNote } | Denied;
export type RemoveDoneNotesResult = { kind: "ok"; notes: WrittenNote[] } | Denied;

/**
 * Upsert a Note for `callerId` (a User._id, or `null` for a guest), who may
 * send the `shareToken` a password-protected Share needs. Creates
 * when no Note has `input._id`, else updates `content`, `time` and `done`;
 * `project` and `user` never change on update. Permission comes from the
 * stored Note's Project on update and from `input.project` on create. A new
 * Note is authored by the caller and joins the Project's Notes. Returns
 * the Note with its author as the public view (never an email). A malformed
 * Note id, Project id on create, or field is `invalid`; a missing Note id
 * creates, and a new Note needs non-empty `content`. A missing or null
 * `time` is 0 on create, a missing or null `done` false, and either is left
 * unchanged on update.
 */
export const upsertNote = async (
  input: NoteInterface,
  callerId: string | null,
  shareToken?: unknown,
): Promise<UpsertNoteResult> => {
  if (input._id !== undefined && !isIdString(input._id)) return INVALID;
  // A null time or done counts as absent: the schema default on create, unchanged on update.
  const time = input.time ?? undefined;
  const done = input.done ?? undefined;
  const editable = pickDefined({ content: input.content, time, done });
  const store = await getStore();
  const existing = isIdString(input._id) ? await store.getNote(input._id) : null;
  if (!existing && !isIdString(input.project)) return INVALID;
  if (!isValidEdit(editable, !existing)) return INVALID;
  const access = await checkWriteAccess(
    existing ? existing.projectId : (input.project as string),
    callerId,
    shareToken,
  );
  if (access.kind !== "allowed") return access;

  if (existing) {
    await store.updateNote(existing._id, editable);
    return { kind: "ok", note: await reloadForCaller(existing._id, access.project.ownerId) };
  }

  const created = await store.createNote({
    _id: isIdString(input._id) ? input._id : newId(),
    content: editable.content as string,
    time: (editable.time as number | undefined) ?? 0,
    done: (editable.done as boolean | undefined) ?? false,
    projectId: access.project._id,
    ...(callerId !== null && { authorId: callerId }),
  });
  return { kind: "ok", note: await reloadForCaller(created._id, access.project.ownerId) };
};

/**
 * Delete every done Note in the Project and return the survivors, their authors as the public view. Same write policy
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

  const store = await getStore();
  await store.removeDoneNotes(access.project._id);
  const notes = await store.listNotes(access.project._id);
  return { kind: "ok", notes: notes.map((note) => toWrittenNote(note, access.project.ownerId)) };
};

const INVALID: Invalid = { kind: "invalid" };

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
  projectId: Id,
  callerId: string | null,
  shareToken: unknown,
): Promise<{ kind: "allowed"; project: ProjectRecord } | Denied> => {
  const project = await (await getStore()).getProject(projectId);
  if (!project) return { kind: "notFound" };
  if (callerId !== null && project.ownerId === callerId) return { kind: "allowed", project };
  const viaShare = mayEditViaShare(project, shareToken);
  if (viaShare.kind === "allowed") return { kind: "allowed", project };
  return viaShare.kind === "passwordRequired" ? { kind: "sharePasswordRequired" } : viaShare;
};

const pickDefined = <T extends Record<string, unknown>>(fields: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  ) as Partial<T>;

// A new id in the ObjectId format the client also generates.
const newId = (): Id =>
  Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, "0") + randomBytes(8).toString("hex");

const toWrittenNote = (
  { author, authorId: _authorId, projectId, ...note }: NoteView,
  ownerId: Id,
): WrittenNote => {
  const user = toPublicAuthor(author, ownerId);
  return { ...note, project: projectId, ...(user && { user }) };
};

const reloadForCaller = async (noteId: Id, ownerId: Id): Promise<WrittenNote> =>
  toWrittenNote((await (await getStore()).loadNote(noteId))!, ownerId);
