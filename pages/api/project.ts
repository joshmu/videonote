/**
 * @path /pages/api/project.ts
 *
 * @project videonote
 * @file project.ts
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Sunday, 22nd November 2020 7:01:59 pm
 * @copyright © 2020 - 2020 MU
 */

import { StatusCodes } from "http-status-codes";

import { ProjectApiActions } from "@/shared/types";
import { withAuthenticatedUser } from "@/utils/auth/withAuthenticatedUser";
import {
  createProject,
  getProject,
  type ProjectInvalid,
  type ProjectNotFound,
  type ProjectOk,
  type ProjectUrlTaken,
  removeProject,
  shareProject,
  unshareProject,
  updateProject,
} from "@/utils/project/projectIntake";

type Outcome = ProjectOk | ProjectNotFound | ProjectUrlTaken | ProjectInvalid;

const INVALID_MSG: Record<ProjectInvalid["reason"], string> = {
  title: "Project title required.",
  share: "Share not specified.",
};

export default withAuthenticatedUser(async (req, res, { userDoc, newToken }) => {
  const { action, project, share } = req.body;
  if (typeof project !== "object" || project === null) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Project not specified" });
  }
  const userId = userDoc._id;
  const projectId = project._id;

  let outcome: Outcome;
  try {
    switch (action) {
      case ProjectApiActions.GET:
        outcome = await getProject(userId, projectId);
        break;
      case ProjectApiActions.CREATE:
        outcome = await createProject(userId, project);
        break;
      case ProjectApiActions.UPDATE:
        outcome = await updateProject(userId, projectId, project);
        break;
      case ProjectApiActions.SHARE:
        outcome = await shareProject(userId, projectId, share);
        break;
      case ProjectApiActions.REMOVE_SHARE:
        outcome = await unshareProject(userId, projectId, share);
        break;
      case ProjectApiActions.REMOVE:
        outcome = await removeProject(userId, projectId);
        break;
      default:
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Action not specified" });
    }
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Database error" });
  }

  switch (outcome.kind) {
    case "invalid":
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: INVALID_MSG[outcome.reason] });
    case "notFound":
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Project not found." });
    case "urlTaken":
      return res.status(StatusCodes.CONFLICT).json({ msg: outcome.message });
    case "ok":
      return res.status(StatusCodes.OK).json({
        project: outcome.project,
        token: newToken,
      });
  }
});
