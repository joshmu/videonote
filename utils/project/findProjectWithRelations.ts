import { Project, type ProjectDoc } from "@/utils/mongoose";

/**
 * Canonical "hydrated Project" lookup: a Project plus its Notes (with each
 * Note's author) and its Share. Every read path that returns a project to a
 * client should funnel through here so that the populate spec lives in one
 * place.
 */
export const findProjectWithRelations = async (query: {
  [key: string]: unknown;
}): Promise<ProjectDoc> =>
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
  ]);
