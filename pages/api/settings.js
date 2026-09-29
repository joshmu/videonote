import { StatusCodes } from "http-status-codes";

import { withAuthenticatedUser } from "@/utils/auth/withAuthenticatedUser";
import { Settings } from "@/utils/mongoose";

// The Settings fields a client may write; `user` and `_id` are never taken from the body.
const EDITABLE = ["currentProject", "playOffset", "showHints", "seekJump", "sidebarWidth"];

const pickEditable = (settings) =>
  Object.fromEntries(EDITABLE.filter((key) => key in settings).map((key) => [key, settings[key]]));

export default withAuthenticatedUser(async (req, res, { userDoc, newToken }) => {
  const settings = req.body?.settings ?? {};

  let settingsDoc;
  try {
    // use _id to search for doc, the rest is data to add
    const { _id } = settings;
    const data = pickEditable(settings);
    // filter for settings _id otherwise if not avail try and use user settings id
    settingsDoc = await Settings.findOne({
      _id: _id ? _id : userDoc.settings,
      user: userDoc._id,
    });

    if (settingsDoc) {
      await settingsDoc.updateOne({ $set: data });
      await settingsDoc.save();
      // assign updated version
      settingsDoc = await Settings.findById(settingsDoc._id);
    } else {
      // if settings doc does not exist then create
      settingsDoc = new Settings({ ...data, user: userDoc._id });
      await settingsDoc.save();
      // assign id to user
      userDoc.settings = settingsDoc._id;
      await userDoc.save();
    }
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Database error" });
  }

  res.status(StatusCodes.OK).json({
    settings: settingsDoc.toObject(),
    token: newToken,
  });
});
