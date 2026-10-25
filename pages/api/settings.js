import { StatusCodes } from "http-status-codes";

import { toSettingsReply } from "@/utils/apiHelpers";
import { withAuthenticatedUser } from "@/utils/auth/withAuthenticatedUser";
import { reportError } from "@/utils/reportError";
import { getStore } from "@/utils/store";

// The Settings fields a client may write; `user` and `_id` are never taken from the body.
const EDITABLE = ["currentProject", "playOffset", "showHints", "seekJump", "sidebarWidth"];

const pickEditable = (settings) =>
  Object.fromEntries(EDITABLE.filter((key) => key in settings).map((key) => [key, settings[key]]));

export default withAuthenticatedUser(async (req, res, { user, newToken }) => {
  let settings;
  try {
    // A User has one Settings, created on first save.
    settings = await (
      await getStore()
    ).saveSettings(user._id, pickEditable(req.body?.settings ?? {}));
  } catch (error) {
    await reportError(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Database error" });
  }

  res.status(StatusCodes.OK).json({
    settings: toSettingsReply(user._id, settings),
    token: newToken,
  });
});
