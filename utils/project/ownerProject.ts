import { Types } from "mongoose";

import type { ProjectDoc } from "@/utils/mongoose";
import { type PublicNote, toPublicNote } from "@/utils/share/shareAccess";

/** A Share as its owner sees it: whether it has a password, never the hash. */
export type OwnerShare = { _id: string; url: string; canEdit: boolean; hasPassword: boolean };

/**
 * A Project as its owner sees it. Notes and Share are projected when
 * populated and sent as ids when not (the create, update and remove replies).
 */
export type OwnerProject = {
  _id: string;
  title: string;
  src?: string;
  user: string;
  notes: Array<PublicNote | string>;
  share: OwnerShare | string | null;
};

type PopulatedShare = { _id: Types.ObjectId; url: string; canEdit: boolean; password?: string };

const toOwnerShare = (share: unknown): OwnerShare | string | null => {
  if (!share) return null;
  if (share instanceof Types.ObjectId) return share.toString();
  const { _id, url, canEdit, password } = share as PopulatedShare;
  return { _id: _id.toString(), url, canEdit, hasPassword: Boolean(password) };
};

/**
 * The one owner-facing projection, for every reply that hands an owner their
 * Project: note authors through the public author view (with role), and the
 * Share's password replaced by `hasPassword`.
 */
export const toOwnerProject = (projectDoc: ProjectDoc): OwnerProject => ({
  _id: projectDoc._id.toString(),
  title: projectDoc.title,
  src: projectDoc.src ?? undefined,
  user: projectDoc.user.toString(),
  notes: (projectDoc.notes as unknown[]).map((note) =>
    note instanceof Types.ObjectId
      ? note.toString()
      : toPublicNote(note as Parameters<typeof toPublicNote>[0], projectDoc),
  ),
  share: toOwnerShare(projectDoc.share),
});
