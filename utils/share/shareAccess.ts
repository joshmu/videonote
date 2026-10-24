import { getStore } from "@/utils/store";
import type { Author, Id, NoteView, ProjectRecord, ProjectView } from "@/utils/store";
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
  const store = await getStore();
  const found = await store.findShareByUrl(shareUrl);
  if (!found) return { kind: "notFound" };

  const access = await verifySharePassword(
    found.share.passwordHash,
    typeof password === "string" ? password : undefined,
  );
  if (access.kind === "passwordRequired" || access.kind === "incorrect") return access;

  const view = await store.loadProject(found.projectId);
  if (!view?.share || view.share._id !== found.share._id) return { kind: "notFound" };

  const project = toPublicProject(view);
  if (access.kind === "open") return { kind: "ok", project };
  const shareToken = issueShareToken({ _id: view.share._id, password: view.share.passwordHash });
  return { kind: "ok", project, shareToken };
};

/**
 * The one "may edit via Share" check: the Project's own Share exists and has
 * `canEdit`, as read with the Project, and a password-protected Share also
 * needs a Share token for its current password (`passwordRequired`
 * otherwise). Callers decide ownership separately.
 */
export const mayEditViaShare = (
  project: Pick<ProjectRecord, "share">,
  shareToken: unknown,
): ShareEditAccess => {
  const { share } = project;
  if (!share?.canEdit) return FORBIDDEN;
  if (
    share.passwordHash &&
    !verifyShareToken(shareToken, { _id: share._id, password: share.passwordHash })
  )
    return { kind: "passwordRequired" };
  return { kind: "allowed" };
};

const FORBIDDEN: ShareEditAccess = { kind: "forbidden" };

/**
 * The public view of a Note author: `{ _id, username, role }`, with no
 * username when it is missing or is the email; `undefined` when the Note has
 * no author. `role` is `owner` when the author owns the Project (`ownerId`).
 */
export const toPublicAuthor = (
  author: Author | null | undefined,
  ownerId: Id,
): PublicAuthor | undefined => {
  if (!author?._id) return undefined;
  const role: AuthorRole = author._id === ownerId ? "owner" : "member";
  // Registration defaults username to the email, which must stay private.
  if (!author.username || author.username === author.email) return { _id: author._id, role };
  return { _id: author._id, username: author.username, role };
};

/** The public view of a Note on a Project owned by `ownerId`. */
export const toPublicNote = (note: NoteView, ownerId: Id): PublicNote => {
  const user = toPublicAuthor(note.author, ownerId);
  return {
    _id: note._id,
    content: note.content,
    time: note.time,
    done: note.done,
    project: note.projectId,
    ...(user && { user }),
  };
};

const toPublicProject = (view: ProjectView): PublicProject => ({
  _id: view._id,
  title: view.title,
  src: view.src,
  share: { _id: view.share!._id, url: view.share!.url, canEdit: view.share!.canEdit },
  notes: view.notes.map((note) => toPublicNote(note, view.ownerId)),
});
