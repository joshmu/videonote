import { Project, type ProjectDoc } from "@/utils/mongoose";

type ProjectQuery = { [key: string]: unknown };

// The one populate spec for a hydrated Project.
const RELATIONS = [
  {
    path: "notes",
    model: "Note",
    populate: {
      path: "user",
      model: "User",
      select: "username email",
    },
  },
  // The password only for the owner projection's `hasPassword`.
  { path: "share", model: "Share", select: "+password" },
];

/**
 * Canonical "hydrated Project" lookup: a Project plus its Notes (with each
 * Note's author) and its Share. Every read path that returns a project to a
 * client should funnel through here so that the populate spec lives in one
 * place.
 */
export const findProjectWithRelations = async (query: ProjectQuery): Promise<ProjectDoc> =>
  Project.findOne(query).populate(RELATIONS);

/** Every Project matching `query`, hydrated like {@link findProjectWithRelations}. */
export const findProjectsWithRelations = async (query: ProjectQuery): Promise<ProjectDoc[]> =>
  Project.find(query).populate(RELATIONS);
