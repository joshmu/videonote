import type { Types } from "mongoose";

import { type ProjectDoc, Share, type UserDoc } from "@/utils/mongoose";
import { findProjectWithRelations } from "@/utils/project/findProjectWithRelations";
import { verifySharePassword } from "@/utils/share/sharePassword";

/** A note author as the public sees them: id, plus username when it is public. */
export type PublicAuthor = { _id: string; username?: string };

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
  | { kind: "ok"; project: PublicProject };

/**
 * Open the Project published at `shareUrl`, checking `password` against the
 * Share. A Share whose Project is gone, or no longer points back at it, is
 * `notFound`. Database errors propagate.
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

  return { kind: "ok", project: toPublicProject(projectDoc) };
};

/**
 * The one "may edit via Share" check: true only when the Project's own Share
 * exists and has `canEdit`. Callers decide ownership separately.
 */
export const mayEditViaShare = async (project: {
  _id: Types.ObjectId;
  share?: Types.ObjectId | { _id: Types.ObjectId } | null;
}): Promise<boolean> => {
  if (!project.share) return false;
  const shareId = "_id" in project.share ? project.share._id : project.share;
  const editable = await Share.exists({ _id: shareId, project: project._id, canEdit: true });
  return editable !== null;
};

/**
 * The public view of a populated note author: `{ _id, username }`, or
 * `{ _id }` when the username is missing or is the email; `undefined` when
 * the Note has no author.
 */
export const toPublicAuthor = (user: unknown): PublicAuthor | undefined => {
  const author = user as Pick<UserDoc, "_id" | "username" | "email"> | null | undefined;
  if (!author?._id) return undefined;
  const _id = author._id.toString();
  // Registration defaults username to the email, which must stay private.
  if (!author.username || author.username === author.email) return { _id };
  return { _id, username: author.username };
};

const toPublicProject = (projectDoc: ProjectDoc): PublicProject => {
  const share = projectDoc.share as unknown as {
    _id: Types.ObjectId;
    url: string;
    canEdit: boolean;
  };
  const notes = projectDoc.notes as unknown as Array<{
    _id: Types.ObjectId;
    content: string;
    time: number;
    done: boolean;
    project?: Types.ObjectId | null;
    user?: unknown;
  }>;
  return {
    _id: projectDoc._id.toString(),
    title: projectDoc.title,
    src: projectDoc.src ?? undefined,
    share: { _id: share._id.toString(), url: share.url, canEdit: share.canEdit },
    notes: notes.map((note) => {
      const user = toPublicAuthor(note.user);
      return {
        _id: note._id.toString(),
        content: note.content,
        time: note.time,
        done: note.done,
        // Legacy Notes may lack `project`; they belong to the Project listing them.
        project: (note.project ?? projectDoc._id).toString(),
        ...(user && { user }),
      };
    }),
  };
};
