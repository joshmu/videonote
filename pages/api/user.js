import bcrypt from 'bcryptjs'
import { StatusCodes } from 'http-status-codes'

import { extractUser } from '@/utils/apiHelpers'
import { authenticateToken, generateAccessToken } from '@/utils/jwt'
import { Project, User } from '@/utils/mongoose'

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

  const { action, user: userData } = req.body

  let email
  try {
    email = await authenticateToken(token)
  } catch (err) {
    console.error(err.message)
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Invalid token' })
  }

  // get user
  const userDoc = await User.findOne({ email })

  try {
    if (action === 'update') {
      await updateUser(userDoc, userData)
    }
    if (action === 'remove') {
      // check password
      const match = await bcrypt.compare(userData.password, userDoc.password)
      if (!match) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ msg: 'Password is incorrect.' })
      }
      // remove all projects associated to this user
      await Project.deleteMany({ _id: { $in: userDoc.projectIds } })
      // remove user
      await userDoc.remove()
      return res
        .status(StatusCodes.OK)
        .json({ msg: `${userDoc.email} removed` })
    }
    if (!action) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: 'Action not specified' })
    }
  } catch (error) {
    console.error(error)
  }

  // get updated user
  const updatedUser = await User.findOne({ email }).lean()

  // token (keep resetting their session length)
  const newToken = generateAccessToken(updatedUser.email)

  res.status(StatusCodes.OK).json({
    user: extractUser(updatedUser),
    token: newToken,
  })
}

const updateUser = async (userDoc, userData) => {
  // if we have nested objects then lets update them and then overwrite currently stored
  if (userData.settings)
    userData.settings = { ...userDoc.settings, ...userData.settings }

  await userDoc.updateOne({ $set: userData })
  await userDoc.save()

  return userDoc
}
