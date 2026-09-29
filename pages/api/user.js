import { StatusCodes } from "http-status-codes";

import { extractUser } from "@/utils/apiHelpers";
import { withAuthenticatedUser } from "@/utils/auth/withAuthenticatedUser";
import { removeAccount, updateProfile } from "@/utils/user/identityIntake";

// Settings are read and written through /api/settings only.
const profileOf = (userDoc) => {
  const { settings: _settings, ...profile } = extractUser(userDoc.toObject());
  return profile;
};

export default withAuthenticatedUser(async (req, res, { userDoc }) => {
  const { action, user: input } = req.body;

  try {
    switch (action) {
      case "update": {
        const outcome = await updateProfile(userDoc, input);
        if (outcome.kind === "invalid") {
          return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ msg: "The email you entered is invalid." });
        }
        if (outcome.kind === "emailTaken") {
          return res.status(StatusCodes.CONFLICT).json({ msg: "The email has already been used." });
        }
        return res.status(StatusCodes.OK).json({
          user: profileOf(outcome.user),
          token: outcome.token,
        });
      }
      case "remove": {
        const outcome = await removeAccount(userDoc, input?.password);
        if (outcome.kind === "wrongPassword") {
          return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Password is incorrect." });
        }
        return res.status(StatusCodes.OK).json({ msg: `${userDoc.email} removed` });
      }
      default:
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Action not specified" });
    }
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Database error" });
  }
});
