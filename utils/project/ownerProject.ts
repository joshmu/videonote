import type { ProjectRecord, ProjectView, ShareRecord } from "@/utils/store";
import { type PublicNote, toPublicNote } from "@/utils/share/shareAccess";

/** A Share as its owner sees it: whether it has a password, never the hash. */
export type OwnerShare = { _id: string; url: string; canEdit: boolean; hasPassword: boolean };

/** A Project as its owner sees it. */
export type OwnerProject = {
  _id: string;
  title: string;
  /** Empty when the Project has no video yet. */
  src: string;
  user: string;
  notes: PublicNote[];
  share: OwnerShare | null;
};

const toOwnerShare = (share: ShareRecord | null): OwnerShare | null =>
  share
    ? {
        _id: share._id,
        url: share.url,
        canEdit: share.canEdit,
        hasPassword: Boolean(share.passwordHash),
      }
    : null;

/**
 * The one owner-facing projection, for every reply that hands an owner their
 * Project: note authors through the public author view (with role), and the
 * Share's password replaced by `hasPassword`. A Project read without its Notes
 * (a new one) has none.
 */
export const toOwnerProject = (project: ProjectView | ProjectRecord): OwnerProject => ({
  _id: project._id,
  title: project.title,
  src: project.src ?? "",
  user: project.ownerId,
  notes: "notes" in project ? project.notes.map((note) => toPublicNote(note, project.ownerId)) : [],
  share: toOwnerShare(project.share),
});
