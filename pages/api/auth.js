import { StatusCodes } from "http-status-codes";

import { toAccountUser, toSettingsReply } from "@/utils/apiHelpers";
import { withAuthenticatedUser } from "@/utils/auth/withAuthenticatedUser";
import { toOwnerProject } from "@/utils/project/ownerProject";
import { getStore } from "@/utils/store";

export default withAuthenticatedUser(async (req, res, { user }) => {
  // In the order the User lists them; only Projects the User still owns.
  const projects = (await (await getStore()).loadProjects(user.projectIds)).filter(
    (project) => project.ownerId === user._id,
  );

  res.status(StatusCodes.OK).json({
    user: {
      ...toAccountUser(user),
      ...(user.settings && { settings: toSettingsReply(user._id, user.settings) }),
      projects: projects.map(toOwnerProject),
    },
  });
});
