import { isObjectIdOrHexString } from "mongoose";

import type { ShareProjectInterface } from "@/shared/types";
import { type OwnerProject, toOwnerProject } from "@/utils/project/ownerProject";
import { attachOrUpdateShare, detachShare, ShareUrlTakenError } from "@/utils/share/shareIntake";
import { getStore, type Id, type ProjectRecord } from "@/utils/store";

export type ProjectOk = { kind: "ok"; project: OwnerProject };
export type ProjectNotFound = { kind: "notFound" };
export type ProjectUrlTaken = { kind: "urlTaken"; message: string };
/**
 * `title`: a new Project needs a non-empty string title. `share`: sharing
 * needs a share object; unsharing needs one whose `_id` is a hex ObjectId string.
 */
export type ProjectInvalid = { kind: "invalid"; reason: "title" | "share" };

/** The only Project fields a client may write. */
export type ProjectInput = { title?: unknown; src?: unknown; [key: string]: unknown };

const NOT_FOUND: ProjectNotFound = { kind: "notFound" };
const INVALID_SHARE: ProjectInvalid = { kind: "invalid", reason: "share" };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isIdString = (value: unknown): value is string =>
  typeof value === "string" && isObjectIdOrHexString(value);

const pickEditable = (input: ProjectInput = {}): { title?: string; src?: string } => {
  const fields: { title?: string; src?: string } = {};
  if (typeof input.title === "string") fields.title = input.title;
  if (typeof input.src === "string") fields.src = input.src;
  return fields;
};

// A malformed or non-string id, or another owner's Project, is a missing project.
const findOwned = async (userId: Id, projectId: unknown): Promise<ProjectRecord | null> => {
  if (!isIdString(projectId)) return null;
  const project = await (await getStore()).getProject(projectId);
  return project?.ownerId === userId ? project : null;
};

export const createProject = async (
  userId: Id,
  input: ProjectInput,
): Promise<ProjectOk | ProjectInvalid> => {
  const fields = pickEditable(input);
  if (!fields.title?.trim()) return { kind: "invalid", reason: "title" };
  const project = await (
    await getStore()
  ).createProject(userId, { title: fields.title, ...fields });
  return { kind: "ok", project: toOwnerProject(project) };
};

export const getProject = async (
  userId: Id,
  projectId: unknown,
): Promise<ProjectOk | ProjectNotFound> => {
  if (!isIdString(projectId)) return NOT_FOUND;
  const project = await (await getStore()).loadProject(projectId);
  return project?.ownerId === userId ? { kind: "ok", project: toOwnerProject(project) } : NOT_FOUND;
};

export const updateProject = async (
  userId: Id,
  projectId: unknown,
  input: ProjectInput,
): Promise<ProjectOk | ProjectNotFound> => {
  const owned = await findOwned(userId, projectId);
  if (!owned) return NOT_FOUND;
  const store = await getStore();
  await store.updateProject(owned._id, pickEditable(input));
  return { kind: "ok", project: toOwnerProject((await store.loadProject(owned._id))!) };
};

export const shareProject = async (
  userId: Id,
  projectId: unknown,
  shareData: Partial<ShareProjectInterface>,
): Promise<ProjectOk | ProjectNotFound | ProjectUrlTaken | ProjectInvalid> => {
  if (!isObject(shareData)) return INVALID_SHARE;
  const owned = await findOwned(userId, projectId);
  if (!owned) return NOT_FOUND;
  try {
    return { kind: "ok", project: await attachOrUpdateShare(owned, shareData) };
  } catch (error) {
    if (error instanceof ShareUrlTakenError) return { kind: "urlTaken", message: error.message };
    throw error;
  }
};

export const unshareProject = async (
  userId: Id,
  projectId: unknown,
  shareInfo: { _id: string },
): Promise<ProjectOk | ProjectNotFound | ProjectInvalid> => {
  const shareId = isObject(shareInfo) ? shareInfo._id : undefined;
  if (!isIdString(shareId)) return INVALID_SHARE;
  const owned = await findOwned(userId, projectId);
  if (!owned) return NOT_FOUND;
  return { kind: "ok", project: await detachShare(owned, { _id: shareId }) };
};

/** Remove an owned Project with its Notes, its Share and the owner's ref. */
export const removeProject = async (
  userId: Id,
  projectId: unknown,
): Promise<ProjectOk | ProjectNotFound> => {
  if (!isIdString(projectId)) return NOT_FOUND;
  const store = await getStore();
  const project = await store.loadProject(projectId);
  if (project?.ownerId !== userId) return NOT_FOUND;
  await store.removeProject(project);
  return { kind: "ok", project: toOwnerProject(project) };
};

/** Remove every Project the user owns, each with the same cascade. */
export const removeUserProjects = async (userId: Id): Promise<void> => {
  const store = await getStore();
  for (const projectId of await store.ownedProjectIds(userId)) {
    const project = await store.getProject(projectId);
    if (project) await store.removeProject(project);
  }
};
