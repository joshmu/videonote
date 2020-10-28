import { StatusCodes } from 'http-status-codes'

import { extractProject, extractUser } from '@/utils/apiHelpers'
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

  const { action, project: settings } = req.body

  let email
  try {
    email = await authenticateToken(token)
  } catch (err) {
    console.error(err.message)
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Invalid token' })
  }

  // get user
  const userDoc = await User.findOne({ email })

  let settingsDoc
  try {
    if (action === 'create') {
      settingsDoc = await createSettings(settings, userDoc)

      // add settings id to user
      userDoc.settings = settingsDoc._id
      await userDoc.save()
    }

    if (action === 'update') {
      settingsDoc = await updateSettings(settings, userDoc)
      if (!settingsDoc)
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ msg: 'Settings not found.' })
    }

    if (action === 'remove') {
      settingsDoc = await Settings.findById(settings._id)

      // remove user's settings reference
      delete userDoc.settings
      await userDoc.save()

      // remove settings doc
      await settingsDoc.remove()
    }

    if (!action) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: 'Action not specified' })
    }
  } catch (error) {
    console.error(error)
  }

  // token (keep resetting their session length)
  const newToken = generateAccessToken(userDoc.email)

  res.status(StatusCodes.OK).json({
    settings: settingsDoc.toObject(),
    token: newToken,
  })
}

const createSettings = async (settingsData, userDoc) => {
  // create settings
  const settingsDoc = new Settings({ ...settingsData, user: userDoc._id })
  await settingsDoc.save()

  return settingsDoc
}

const updateSettings = async (settingsData, userDoc) => {
  // remove the id and any nested array/object
  const { _id, ...data } = settingsData

  const settingsDoc = await Settings.findOne({ _id, user: userDoc._id })
  await settingsDoc.updateOne({ $set: data })
  await settingsDoc.save()

  return settingsDoc
}
