import type { ProjectDocInterface, ShareProjectInterface } from "@/shared/types";
import { Share } from "@/utils/mongoose";
import { findProjectWithRelations } from "@/utils/project/findProjectWithRelations";
import { hashSharePassword } from "@/utils/share/sharePassword";

/**
 * Thrown when a Share cannot be created because its `url` is already in use.
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

// Hash the password only when the caller supplied the field. An absent
// `password` key means "leave it alone" — important on the update branch where
// we must not silently clear a user's existing protection.
const withHashedPassword = async (
  shareData: Partial<ShareProjectInterface>,
): Promise<Partial<ShareProjectInterface>> => {
  if (!("password" in shareData)) return shareData;
  return { ...shareData, password: (await hashSharePassword(shareData.password)) ?? undefined };
};

/**
 * Attach a new Share to a Project, or update the Share that's already
 * attached. The branch is decided by `projectDoc.share`. Returns the project
 * re-loaded with notes and share populated so callers can hand it straight
 * back to the client.
 */
export const attachOrUpdateShare = async (
  projectDoc: ProjectDocInterface,
  shareData: Partial<ShareProjectInterface>,
): Promise<ProjectDocInterface> => {
  const persisted = await withHashedPassword(shareData);

  if (projectDoc.share) {
    await Share.findByIdAndUpdate(projectDoc.share, { $set: persisted });
    return findProjectWithRelations({ _id: projectDoc._id });
  }

  let createdId: unknown;
  try {
    const created = await Share.create({
      ...persisted,
      project: projectDoc._id,
      user: projectDoc.user,
    });
    createdId = created._id;
  } catch (err) {
    if (isDuplicateKey(err)) throw new ShareUrlTakenError();
    throw err;
  }
  projectDoc.share = createdId as string;
  await projectDoc.save();
  return findProjectWithRelations({ _id: projectDoc._id });
};

/**
 * Remove the Share that was attached to this Project. Scoped by user so the
 * caller cannot detach a share from a project they don't own. Returns the
 * project re-loaded with notes and share populated.
 */
export const detachShare = async (
  projectDoc: ProjectDocInterface,
  shareInfo: { _id: string },
): Promise<ProjectDocInterface> => {
  await Share.deleteOne({
    _id: shareInfo._id,
    project: projectDoc._id,
    user: projectDoc.user,
  });
  projectDoc.share = null;
  await projectDoc.save();
  return findProjectWithRelations({ _id: projectDoc._id });
};
