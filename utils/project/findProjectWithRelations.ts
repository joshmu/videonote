import type { ProjectDocInterface } from "@/shared/types";
import { Project } from "@/utils/mongoose";

/**
 * Canonical "hydrated Project" lookup: a Project plus its Notes (with each
 * Note's author) and its Share. Every read path that returns a project to a
 * client should funnel through here so that the populate spec lives in one
 * place.
 */
export const findProjectWithRelations = (query: {
  [key: string]: unknown;
}): Promise<ProjectDocInterface> =>
  Project.findOne(query).populate([
    {
      path: "notes",
      model: "Note",
      populate: {
        path: "user",
        model: "User",
        select: "username email",
      },
    },
    { path: "share", model: "Share" },
  ]) as unknown as Promise<ProjectDocInterface>;
