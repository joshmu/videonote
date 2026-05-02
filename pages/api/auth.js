import { StatusCodes } from "http-status-codes";

import { extractUser } from "@/utils/apiHelpers";
import { withAuthenticatedUser } from "@/utils/auth/withAuthenticatedUser";

export default withAuthenticatedUser(async (req, res, { userDoc }) => {
  await userDoc.populate([
    { path: "settings", model: "Settings" },
    {
      path: "projects",
      model: "Project",
      populate: [
        {
          path: "notes",
          model: "Note",
          populate: { path: "user", model: "User", select: "username email" },
        },
        { path: "share", model: "Share" },
      ],
    },
  ]);

  res.status(StatusCodes.OK).json({
    user: extractUser(userDoc.toObject()),
  });
});
