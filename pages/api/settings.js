import { StatusCodes } from 'http-status-codes'

import { authenticateToken, generateAccessToken } from '@/utils/jwt'
import { Settings, User } from '@/utils/mongoose'

export default async (req, res) => {
  // Gather the jwt access token from the request header
  let token = req.headers['authorization']
  // strip 'bearer'
  if (token) token = token.replace(/bearer /i, '')
  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: 'No token. Authorization denied.' })
  }

  let email
  try {
    email = await authenticateToken(token)
  } catch (error) {
    console.error(error.message)
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: 'Invalid token', error })
  }

  // get user
  const userDoc = await User.findOne({ email })

  const { settings } = req.body

  let settingsDoc
  try {
    // use _id to search for doc, the rest is data to add
    const { _id, ...data } = settings
    // filter for settings _id otherwise if not avail try and use user settings id
    settingsDoc = await Settings.findOne({
      _id: _id ? _id : userDoc.settings,
      user: userDoc._id,
    })

    if (settingsDoc) {
      await settingsDoc.updateOne({ $set: data })
      await settingsDoc.save()
      // assign updated version
      settingsDoc = await Settings.findById(settingsDoc._id)
    } else {
      // if settings doc does not exist then create
      settingsDoc = new Settings({ ...settings, user: userDoc._id })
      await settingsDoc.save()
      // assign id to user
      userDoc.settings = settingsDoc._id
      await userDoc.save()
    }
  } catch (error) {
    console.error(error)
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Database error', error })
  }

  // token (keep resetting their session length)
  const newToken = generateAccessToken(userDoc.email)

  res.status(StatusCodes.OK).json({
    settings: settingsDoc.toObject(),
    token: newToken,
  })
}
