import type { ShareProjectInterface } from "@/shared/types";
import { type ProjectDoc, Share } from "@/utils/mongoose";
import { findProjectWithRelations } from "@/utils/project/findProjectWithRelations";
import { type OwnerProject, toOwnerProject } from "@/utils/project/ownerProject";
import { hashSharePassword } from "@/utils/share/sharePassword";

/**
 * Thrown when a Share cannot be created or updated because its `url` is
 * already in use.
 * Maps to the unique-index violation on `Share.url` so callers can return a
 * useful HTTP error instead of a generic 500.
 */
export class ShareUrlTakenError extends Error {
  constructor(message = "Specified share project url is taken.") {
    super(message);
    this.name = "ShareUrlTakenError";
  }
}

const MONGO_DUPLICATE_KEY = 11000;
const isDuplicateKey = (err: unknown): boolean =>
  typeof err === "object" &&
  err !== null &&
  (err as { code?: number }).code === MONGO_DUPLICATE_KEY;

// Run a Share write, surfacing a duplicate `url` as ShareUrlTakenError.
const withUrlTaken = async <T>(write: () => Promise<T>): Promise<T> => {
  try {
    return await write();
  } catch (err) {
    if (isDuplicateKey(err)) throw new ShareUrlTakenError();
    throw err;
  }
};

/** The Share fields an owner may write; `project` and `user` come from the server. */
const EDITABLE = ["url", "password", "canEdit"] as const;
type EditableShare = Partial<Pick<ShareProjectInterface, (typeof EDITABLE)[number]>>;

// Keep only the editable fields, hashing the password only when the caller
// supplied the field. An absent `password` key means "leave it alone"; an
// empty one removes the protection.
const toPersisted = async (shareData: Partial<ShareProjectInterface>): Promise<EditableShare> => {
  const persisted: EditableShare = Object.fromEntries(
    EDITABLE.filter((key) => key in shareData).map((key) => [key, shareData[key]]),
  );
  if (!("password" in persisted)) return persisted;
  return { ...persisted, password: (await hashSharePassword(persisted.password)) ?? "" };
};

/**
 * Attach a new Share to a Project, or update the Share that's already
 * attached. The branch is decided by `projectDoc.share`. Returns the project
 * re-loaded in the owner projection so callers can hand it straight back to
 * the client.
 */
export const attachOrUpdateShare = async (
  projectDoc: ProjectDoc,
  shareData: Partial<ShareProjectInterface>,
): Promise<OwnerProject> => {
  const persisted = await toPersisted(shareData);

  if (projectDoc.share) {
    await withUrlTaken(() => Share.findByIdAndUpdate(projectDoc.share, { $set: persisted }));
    return reload(projectDoc);
  }

  const created = await withUrlTaken(() =>
    Share.create({ ...persisted, project: projectDoc._id, user: projectDoc.user }),
  );
  projectDoc.share = created._id;
  await projectDoc.save();
  return reload(projectDoc);
};

/**
 * Remove the Share that was attached to this Project. Scoped by user so the
 * caller cannot detach a share from a project they don't own. Returns the
 * project re-loaded in the owner projection.
 */
export const detachShare = async (
  projectDoc: ProjectDoc,
  shareInfo: { _id: string },
): Promise<OwnerProject> => {
  await Share.deleteOne({
    _id: shareInfo._id,
    project: projectDoc._id,
    user: projectDoc.user,
  });
  projectDoc.share = null;
  await projectDoc.save();
  return reload(projectDoc);
};

const reload = async (projectDoc: ProjectDoc): Promise<OwnerProject> =>
  toOwnerProject(await findProjectWithRelations({ _id: projectDoc._id }));
