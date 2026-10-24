import type { ShareProjectInterface } from "@/shared/types";
import { type OwnerProject, toOwnerProject } from "@/utils/project/ownerProject";
import { hashSharePassword } from "@/utils/share/sharePassword";
import { getStore, type ProjectRecord, type ShareChanges } from "@/utils/store";

/**
 * Thrown when a Share cannot be created or updated because its `url` is
 * already in use, so callers can return a useful HTTP error instead of a
 * generic 500.
 */
export class ShareUrlTakenError extends Error {
  constructor(message = "Specified share project url is taken.") {
    super(message);
    this.name = "ShareUrlTakenError";
  }
}

// Keep only the editable fields, hashing the password only when the caller
// supplied the field. An absent `password` key means "leave it alone"; an
// empty one removes the protection.
const toChanges = async (shareData: Partial<ShareProjectInterface>): Promise<ShareChanges> => ({
  ...("url" in shareData && { url: shareData.url }),
  ...("canEdit" in shareData && { canEdit: shareData.canEdit }),
  ...("password" in shareData && {
    passwordHash: (await hashSharePassword(shareData.password)) ?? "",
  }),
});

/**
 * Attach a new Share to a Project, or update the Share that's already
 * attached. Writes only `url`, `password` and `canEdit` from the caller.
 * Returns the project re-loaded in the owner projection so callers can hand
 * it straight back to the client.
 */
export const attachOrUpdateShare = async (
  project: ProjectRecord,
  shareData: Partial<ShareProjectInterface>,
): Promise<OwnerProject> => {
  const store = await getStore();
  const written = await store.putShare(project._id, await toChanges(shareData));
  if (written === "urlTaken") throw new ShareUrlTakenError();
  return reload(project);
};

/**
 * Remove the Share that was attached to this Project, if it is
 * `shareInfo._id`. Returns the project re-loaded in the owner projection.
 */
export const detachShare = async (
  project: ProjectRecord,
  shareInfo: { _id: string },
): Promise<OwnerProject> => {
  const store = await getStore();
  await store.removeShare(project._id, shareInfo._id);
  return reload(project);
};

const reload = async (project: ProjectRecord): Promise<OwnerProject> =>
  toOwnerProject((await (await getStore()).loadProject(project._id))!);
