import type { Types } from "mongoose";

import { type ProjectDoc, Share, type UserDoc } from "@/utils/mongoose";
import { findProjectWithRelations } from "@/utils/project/findProjectWithRelations";
import { verifySharePassword } from "@/utils/share/sharePassword";
import { issueShareToken, verifyShareToken } from "@/utils/share/shareToken";

/** An author's role on a Project: its owner or another User. A Note with no author is a guest's. */
export type AuthorRole = "owner" | "member";

/** A note author as the public sees them: id, role, plus username when it is public. */
export type PublicAuthor = { _id: string; username?: string; role: AuthorRole };

export type PublicNote = {
  _id: string;
  content: string;
  time: number;
  done: boolean;
  project: string;
  user?: PublicAuthor;
};

/** What a Share exposes of its Project. No Share password, no owner details. */
export type PublicProject = {
  _id: string;
  title: string;
  src?: string;
  share: { _id: string; url: string; canEdit: boolean };
  notes: PublicNote[];
};

export type OpenSharedProjectResult =
  | { kind: "notFound" }
  | { kind: "passwordRequired" }
  | { kind: "incorrect" }
  | { kind: "ok"; project: PublicProject; shareToken?: string };

/** Whether a non-owner may write Notes through the Project's Share. */
export type ShareEditAccess =
  | { kind: "allowed" }
  | { kind: "forbidden" }
  | { kind: "passwordRequired" };

/**
 * Open the Project published at `shareUrl`, checking `password` against the
 * Share. A Share whose Project is gone, or no longer points back at it, is
 * `notFound`. A password-protected Share also hands out a Share token for
 * Note writes. Database errors propagate.
 */
export const openSharedProject = async (
  shareUrl: unknown,
  password: unknown,
): Promise<OpenSharedProjectResult> => {
  if (typeof shareUrl !== "string") return { kind: "notFound" };
  const shareDoc = await Share.findOne({ url: shareUrl });
  if (!shareDoc?.project) return { kind: "notFound" };

  const access = await verifySharePassword(
    shareDoc.password,
    typeof password === "string" ? password : undefined,
  );
  if (access.kind === "passwordRequired" || access.kind === "incorrect") return access;

  const projectDoc = await findProjectWithRelations({ _id: shareDoc.project });
  if (!projectDoc?.share?._id.equals(shareDoc._id)) return { kind: "notFound" };

  const project = toPublicProject(projectDoc);
  if (access.kind === "open") return { kind: "ok", project };
  const shareToken = issueShareToken({ _id: shareDoc._id, password: shareDoc.password! });
  return { kind: "ok", project, shareToken };
};

/**
 * The one "may edit via Share" check: the Project's own Share exists and has
 * `canEdit`, both read live, and a password-protected Share also needs a
 * Share token for its current password (`passwordRequired` otherwise).
 * Callers decide ownership separately.
 */
export const mayEditViaShare = async (
  project: {
    _id: Types.ObjectId;
    share?: Types.ObjectId | { _id: Types.ObjectId } | null;
  },
  shareToken: unknown,
): Promise<ShareEditAccess> => {
  if (!project.share) return FORBIDDEN;
  const shareId = "_id" in project.share ? project.share._id : project.share;
  const share = await Share.findOne({ _id: shareId, project: project._id, canEdit: true })
    .select("password")
    .lean();
  if (!share) return FORBIDDEN;
  if (share.password && !verifyShareToken(shareToken, share)) return { kind: "passwordRequired" };
  return { kind: "allowed" };
};

const FORBIDDEN: ShareEditAccess = { kind: "forbidden" };

/**
 * The public view of a populated note author: `{ _id, username, role }`, with
 * no username when it is missing or is the email; `undefined` when the Note
 * has no author. `role` is `owner` when the author owns the Project (`ownerId`).
 */
export const toPublicAuthor = (
  user: unknown,
  ownerId: Types.ObjectId | string,
): PublicAuthor | undefined => {
  const author = user as Pick<UserDoc, "_id" | "username" | "email"> | null | undefined;
  if (!author?._id) return undefined;
  const _id = author._id.toString();
  const role: AuthorRole = _id === ownerId.toString() ? "owner" : "member";
  // Registration defaults username to the email, which must stay private.
  if (!author.username || author.username === author.email) return { _id, role };
  return { _id, username: author.username, role };
};

type PopulatedNote = {
  _id: Types.ObjectId;
  content: string;
  time: number;
  done: boolean;
  project?: Types.ObjectId | null;
  user?: unknown;
};

/** The public view of a Note whose author is populated, on the Project listing it. */
export const toPublicNote = (
  note: PopulatedNote,
  project: { _id: Types.ObjectId; user: Types.ObjectId },
): PublicNote => {
  const user = toPublicAuthor(note.user, project.user);
  return {
    _id: note._id.toString(),
    content: note.content,
    time: note.time,
    done: note.done,
    // Legacy Notes may lack `project`; they belong to the Project listing them.
    project: (note.project ?? project._id).toString(),
    ...(user && { user }),
  };
};

const toPublicProject = (projectDoc: ProjectDoc): PublicProject => {
  const share = projectDoc.share as unknown as {
    _id: Types.ObjectId;
    url: string;
    canEdit: boolean;
  };
  const notes = projectDoc.notes as unknown as PopulatedNote[];
  return {
    _id: projectDoc._id.toString(),
    title: projectDoc.title,
    src: projectDoc.src ?? undefined,
    share: { _id: share._id.toString(), url: share.url, canEdit: share.canEdit },
    notes: notes.map((note) => toPublicNote(note, projectDoc)),
  };
};
