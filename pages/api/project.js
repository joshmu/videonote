import { StatusCodes } from 'http-status-codes'

import { authenticateToken, generateAccessToken } from '@/utils/jwt'
import { Note, Project, User } from '@/utils/mongoose'

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

  // validate
  let email
  try {
    email = await authenticateToken(token)
  } catch (err) {
    console.error(err.message)
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Invalid token' })
  }

  // get user
  const userDoc = await User.findOne({ email })

  // data passed
  const { action, project } = req.body

  let projectDoc
  try {
    if (action === 'get') {
      projectDoc = await Project.findOne({
        _id: project._id,
        user: userDoc._id,
      }).populate({ path: 'notes', model: 'Note' })
    }
    if (action === 'create') {
      projectDoc = new Project({
        ...project,
        user: userDoc._id,
      })
      await projectDoc.save()

      // add project id to user's projectId's list
      userDoc.projects.push(projectDoc._id)
      await userDoc.save()
    }
    if (action === 'update') {
      // remove the id and any nested array/object
      const { _id, ...data } = project

      // find project by both project and user _id
      projectDoc = await Project.findOneAndUpdate(
        { _id, user: userDoc._id },
        { $set: data },
        { new: true }
      )
    }
    if (action === 'remove') {
      // get projectDoc via project and user _id
      projectDoc = await Project.findOne({
        _id: project._id,
        user: userDoc._id,
      })

      // remove all notes associated to project
      await Note.deleteMany({
        project: projectDoc._id,
      })

      // remove user's reference to the project
      await userDoc.projects.pull(projectDoc._id)
      await userDoc.save()

      // remove project
      await projectDoc.remove()

      // token (keep resetting their session length)
      const newToken = generateAccessToken(userDoc.email)

      return res.status(StatusCodes.OK).json({
        // toObject method does not work on removed/deleted mongoose document
        project: projectDoc,
        token: newToken,
      })
    }
    if (!action) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: 'Action not specified' })
    }
  } catch (error) {
    console.error(error)
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Database error', error })
  }

  // token (keep resetting their session length)
  const newToken = generateAccessToken(userDoc.email)

  return res.status(StatusCodes.OK).json({
    project: projectDoc.toObject(),
    token: newToken,
  })
}
