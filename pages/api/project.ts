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

import { ProjectApiActions, ProjectDocInterface } from "@/shared/types";
import { withAuthenticatedUser } from "@/utils/auth/withAuthenticatedUser";
import { Note, Project, Share } from "@/utils/mongoose";
import { findProjectWithRelations } from "@/utils/project/findProjectWithRelations";
import { attachOrUpdateShare, detachShare, ShareUrlTakenError } from "@/utils/share/shareIntake";

export default withAuthenticatedUser(async (req, res, { userDoc, newToken }) => {
  const { action, project } = req.body;

  let projectDoc: ProjectDocInterface;
  try {
    switch (action) {
      case ProjectApiActions.GET:
        projectDoc = await findProjectWithRelations({
          _id: project._id,
          user: userDoc._id,
        });
        break;

      case ProjectApiActions.CREATE:
        projectDoc = new Project({
          ...project,
          user: userDoc._id,
        });
        await projectDoc.save();
        userDoc.projects.push(projectDoc._id);
        await userDoc.save();
        break;

      case ProjectApiActions.UPDATE: {
        const { _id, ...data } = project;
        projectDoc = await Project.findOneAndUpdate(
          { _id, user: userDoc._id },
          { $set: data },
          { new: true },
        );
        break;
      }

      case ProjectApiActions.SHARE: {
        const owned = await Project.findOne({
          _id: project._id,
          user: userDoc._id,
        });
        try {
          projectDoc = await attachOrUpdateShare(owned, req.body.share);
        } catch (error) {
          if (error instanceof ShareUrlTakenError) {
            return res
              .status(StatusCodes.INTERNAL_SERVER_ERROR)
              .json({ msg: error.message, error });
          }
          throw error;
        }
        break;
      }

      case ProjectApiActions.REMOVE_SHARE: {
        const owned = await Project.findOne({
          _id: project._id,
          user: userDoc._id,
        });
        projectDoc = await detachShare(owned, req.body.share);
        break;
      }

      case ProjectApiActions.REMOVE:
        projectDoc = await Project.findOne({
          _id: project._id,
          user: userDoc._id,
        });
        await Note.deleteMany({ project: projectDoc._id });
        await Share.deleteMany({ project: projectDoc._id });
        await userDoc.projects.pull(projectDoc._id);
        await userDoc.save();
        await projectDoc.deleteOne();

        return res.status(StatusCodes.OK).json({
          // toObject method does not work on removed/deleted mongoose document
          project: projectDoc,
          token: newToken,
        });

      default:
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Action not specified" });
    }
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Database error", error });
  }

  return res.status(StatusCodes.OK).json({
    project: projectDoc.toObject(),
    token: newToken,
  });
});
