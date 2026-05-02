import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";

import { extractUser } from "@/utils/apiHelpers";
import { withAuthenticatedUser } from "@/utils/auth/withAuthenticatedUser";
import { Note, Project, Settings, Share, User } from "@/utils/mongoose";

export default withAuthenticatedUser(async (req, res, { userDoc, email, newToken }) => {
  const { action, user: userData } = req.body;

  try {
    if (action === "update") {
      await updateUser(userDoc, userData);
    }
    if (action === "remove") {
      // check password
      const match = await bcrypt.compare(userData.password, userDoc.password);
      if (!match) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Password is incorrect." });
      }
      // delete share docs by user
      await Share.deleteMany({ user: userDoc._id });
      // get all projects owned by user
      const projectDocs = await Project.find({
        _id: { $in: userDoc.projects },
      });
      for (let projectDoc of projectDocs) {
        // delete all notes which reference any of these projects
        await Note.deleteMany({ project: projectDoc._id });
        // delete the project
        await projectDoc.remove();
      }
      // await Project.deleteMany({ _id: { $in: userDoc.projectIds } })

      // delete all notes by user - which may be associated to projects not owned by the user
      await Note.deleteMany({ user: userDoc._id });

      // remove user settings doc
      await Settings.deleteOne({ user: userDoc._id });
      // remove user (legacy Mongoose API; see CONTEXT.md follow-ups)
      await /** @type {any} */ (userDoc).remove();

      return res.status(StatusCodes.OK).json({ msg: `${userDoc.email} removed` });
    }
    if (!action) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Action not specified" });
    }
  } catch (error) {
    console.error(error);
  }

  // get updated user
  const updatedUser = await User.findOne({ email }).lean();

  res.status(StatusCodes.OK).json({
    user: extractUser(updatedUser),
    token: newToken,
  });
});

const updateUser = async (userDoc, userData) => {
  // if we have settings data to update and we have previously stored data then merge
  // todo: this would be refactored to its own settings collection
  if (userData.settings && userDoc.settings instanceof Object) {
    userData.settings = { ...userDoc.settings, ...userData.settings };
  }

  await userDoc.updateOne({ $set: userData });
  await userDoc.save();

  return userDoc;
};
