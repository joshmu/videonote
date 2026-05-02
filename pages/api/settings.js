import { StatusCodes } from "http-status-codes";

import { withAuthenticatedUser } from "@/utils/auth/withAuthenticatedUser";
import { Settings } from "@/utils/mongoose";

export default withAuthenticatedUser(async (req, res, { userDoc, newToken }) => {
  const { settings } = req.body;

  let settingsDoc;
  try {
    // use _id to search for doc, the rest is data to add
    const { _id, ...data } = settings;
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
      settingsDoc = new Settings({ ...settings, user: userDoc._id });
      await settingsDoc.save();
      // assign id to user
      userDoc.settings = settingsDoc._id;
      await userDoc.save();
    }
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Database error", error });
  }

  res.status(StatusCodes.OK).json({
    settings: settingsDoc.toObject(),
    token: newToken,
  });
});
