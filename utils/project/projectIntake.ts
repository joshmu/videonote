import { isObjectIdOrHexString, type Types } from "mongoose";

import type { ShareProjectInterface } from "@/shared/types";
import { Note, Project, type ProjectDoc, Share, User } from "@/utils/mongoose";
import { findProjectWithRelations } from "@/utils/project/findProjectWithRelations";
import { type OwnerProject, toOwnerProject } from "@/utils/project/ownerProject";
import { attachOrUpdateShare, detachShare, ShareUrlTakenError } from "@/utils/share/shareIntake";

type Id = Types.ObjectId | string;

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

const pickEditable = (input: ProjectInput = {}): { title?: string; src?: string } => {
  const fields: { title?: string; src?: string } = {};
  if (typeof input.title === "string") fields.title = input.title;
  if (typeof input.src === "string") fields.src = input.src;
  return fields;
};

// A malformed or non-string id is treated as a missing project.
const findOwned = async (userId: Id, projectId: unknown): Promise<ProjectDoc | null> => {
  if (!isObjectIdOrHexString(projectId)) return null;
  return Project.findOne({ _id: projectId, user: userId });
};

export const createProject = async (
  userId: Id,
  input: ProjectInput,
): Promise<ProjectOk | ProjectInvalid> => {
  const fields = pickEditable(input);
  if (!fields.title?.trim()) return { kind: "invalid", reason: "title" };
  const project = await Project.create({ ...fields, user: userId });
  await User.updateOne({ _id: userId }, { $push: { projects: project._id } });
  return { kind: "ok", project: toOwnerProject(project) };
};

export const getProject = async (
  userId: Id,
  projectId: unknown,
): Promise<ProjectOk | ProjectNotFound> => {
  if (!isObjectIdOrHexString(projectId)) return NOT_FOUND;
  const project = await findProjectWithRelations({ _id: projectId, user: userId });
  return project ? { kind: "ok", project: toOwnerProject(project) } : NOT_FOUND;
};

export const updateProject = async (
  userId: Id,
  projectId: unknown,
  input: ProjectInput,
): Promise<ProjectOk | ProjectNotFound> => {
  if (!isObjectIdOrHexString(projectId)) return NOT_FOUND;
  const project = await Project.findOneAndUpdate(
    { _id: projectId, user: userId },
    { $set: pickEditable(input) },
    { returnDocument: "after" },
  );
  return project ? { kind: "ok", project: toOwnerProject(project) } : NOT_FOUND;
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
  if (typeof shareId !== "string" || !isObjectIdOrHexString(shareId)) return INVALID_SHARE;
  const owned = await findOwned(userId, projectId);
  if (!owned) return NOT_FOUND;
  return { kind: "ok", project: await detachShare(owned, shareInfo) };
};

// Each step is a no-op when already done and the Project goes last, so a
// failed cascade leaves the project findable and a re-run finishes the job.
const cascadeRemove = async (project: ProjectDoc): Promise<void> => {
  await Note.deleteMany({ $or: [{ project: project._id }, { _id: { $in: project.notes } }] });
  await Share.deleteMany({ project: project._id });
  await User.updateOne({ _id: project.user }, { $pull: { projects: project._id } });
  await Project.deleteOne({ _id: project._id });
};

/** Remove an owned Project with its Notes, its Share and the owner's ref. */
export const removeProject = async (
  userId: Id,
  projectId: unknown,
): Promise<ProjectOk | ProjectNotFound> => {
  const owned = await findOwned(userId, projectId);
  if (!owned) return NOT_FOUND;
  await cascadeRemove(owned);
  return { kind: "ok", project: toOwnerProject(owned) };
};

/** Remove every Project the user owns, each with the same cascade. */
export const removeUserProjects = async (userId: Id): Promise<void> => {
  for (const project of await Project.find({ user: userId })) {
    await cascadeRemove(project);
  }
};
