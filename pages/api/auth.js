import { StatusCodes } from "http-status-codes";

import { extractUser } from "@/utils/apiHelpers";
import { withAuthenticatedUser } from "@/utils/auth/withAuthenticatedUser";
import { findProjectsWithRelations } from "@/utils/project/findProjectWithRelations";
import { toOwnerProject } from "@/utils/project/ownerProject";

export default withAuthenticatedUser(async (req, res, { userDoc }) => {
  await userDoc.populate({ path: "settings", model: "Settings" });
  const found = await findProjectsWithRelations({
    _id: { $in: userDoc.projects },
    user: userDoc._id,
  });
  // Keep the order of `User.projects`.
  const byId = new Map(found.map((project) => [project._id.toString(), project]));
  const projects = userDoc.projects.map((_id) => byId.get(_id.toString())).filter(Boolean);

  res.status(StatusCodes.OK).json({
    user: {
      ...extractUser(userDoc.toObject()),
      projects: projects.map(toOwnerProject),
    },
  });
});
