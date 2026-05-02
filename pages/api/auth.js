import { StatusCodes } from "http-status-codes";

import { extractUser } from "@/utils/apiHelpers";
import { withAuthenticatedUser } from "@/utils/auth/withAuthenticatedUser";
import { User } from "@/utils/mongoose";

export default withAuthenticatedUser(async (req, res, { email }) => {
  // get user via email (including their settings, projects & notes per project)
  const user = await User.findOne({ email })
    .populate({ path: "settings", model: "Settings" })
    .populate({
      path: "projects",
      model: "Project",
      populate: [
        {
          path: "notes",
          model: "Note",
          populate: {
            path: "user",
            model: "User",
            select: "username email",
          },
        },
        {
          path: "share",
          model: "Share",
        },
      ],
    })
    .lean();

  if (user === null) return res.status(StatusCodes.BAD_REQUEST).json({ msg: "No user found." });

  res.status(StatusCodes.OK).json({
    user: extractUser(user),
  });
});
