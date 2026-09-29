import { StatusCodes } from "http-status-codes";

import { extractUser } from "@/utils/apiHelpers";
import { withAuthenticatedUser } from "@/utils/auth/withAuthenticatedUser";
import { findProjectWithRelations } from "@/utils/project/findProjectWithRelations";

export default withAuthenticatedUser(async (req, res, { userDoc }) => {
  await userDoc.populate({ path: "settings", model: "Settings" });
  const projects = await Promise.all(
    userDoc.projects.map((_id) => findProjectWithRelations({ _id, user: userDoc._id })),
  );

  res.status(StatusCodes.OK).json({
    user: {
      ...extractUser(userDoc.toObject()),
      projects: projects.filter(Boolean).map((project) => project.toObject()),
    },
  });
});
