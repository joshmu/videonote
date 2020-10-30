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

  const { action, note } = req.body

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

  // different route if we choose to delete all complete notes from specified project
  if (action === 'remove done notes') {
    return await removeDoneNotes(res, userDoc, req.body.projectId)
  }

  let noteDoc
  try {
    if (!action) {
      // use _id to search for doc, the rest is data to add
      const { _id, ...data } = note

      noteDoc = await Note.findById(_id)

      // if note exists
      if (noteDoc) {
        await noteDoc.updateOne({ $set: data })
        await noteDoc.save()
        // assign updated version
        noteDoc = await Note.findById(noteDoc._id)
      } else {
        // if note doc does not exist
        // add user info to note
        note.user = userDoc._id

        // create with whole 'note' since we are passing a manually created _id for faster state management client side
        noteDoc = new Note(note)
        await noteDoc.save()
        // add note id to relevant project
        const projectDoc = await Project.findById(noteDoc.project)
        projectDoc.notes.push(noteDoc._id)
        await projectDoc.save()
      }
    }
    if (action === 'delete') {
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
    note: noteDoc.toObject(),
    token: newToken,
  })
}

async function removeDoneNotes(res, userDoc, projectId) {
  console.log('removing completed notes from project:', projectId)
  // delete all notes which match projectId and are 'done'
  await Note.deleteMany({ project: projectId, done: true })
  // return all notes for project
  const notes = await Note.find({ project: projectId }).lean()

  // token (keep resetting their session length)
  const newToken = generateAccessToken(userDoc.email)

  res.status(StatusCodes.OK).json({
    notes,
    token: newToken,
  })
}
