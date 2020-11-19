import { StatusCodes } from 'http-status-codes'
import { NextApiRequest, NextApiResponse } from 'next'

import {
  NoteApiAction,
  NoteDocInterface,
  NoteInterface,
  UserDocInterface,
} from '@/root/src/components/shared/types'
import { authenticateToken, generateAccessToken } from '@/utils/jwt'
import { Note, Project, User } from '@/utils/mongoose'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  console.log('note api')
  // detect user via token
  // if no user then the 'note' is not assigned a user
  let isGuestUser: boolean = false

  // Gather the jwt access token from the request header
  let token: string = req.headers['authorization']
  // strip 'bearer'
  if (token) {
    token = token.replace(/bearer /i, '')
  } else {
    // if there is no token then we could have a guest
    console.log('Guest user')
    isGuestUser = true
  }

  // 'note' is inclusive of projectId
  const {
    action,
    note,
  }: { action: NoteApiAction; note: NoteInterface } = req.body

  // if the user is not a guest then grab their information
  let userDoc: UserDocInterface
  if (!isGuestUser) {
    let email: string
    try {
      email = authenticateToken(token)
    } catch (error) {
      console.error(error.message)
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: 'Invalid token', error })
    }

    // get user
    userDoc = await User.findOne({ email })
  }

  // different route if we choose to delete all complete notes from specified project
  if (action === NoteApiAction.REMOVE_DONE_NOTES) {
    return await removeDoneNotes(res, userDoc, req.body.projectId)
  }

  let noteDoc: NoteDocInterface
  try {
    if (!action) {
      // use _id to search for doc, the rest is data to add
      const { _id, ...data } = note

      noteDoc = await Note.findById(_id)

      // if note exists
      if (noteDoc) {
        // update user if we have one (in case we have a different user modifying a note)
        // todo: array of users who modify the note when original 'user' is present?
        if (!isGuestUser) data.user = userDoc._id

        await noteDoc.updateOne({ $set: data })
        await noteDoc.save()
        // assign updated version
        noteDoc = await Note.findById(noteDoc._id)
      } else {
        // create note

        // add user info to note
        if (!isGuestUser) note.user = userDoc._id

        // create with whole 'note' since we are passing a manually created _id for faster state management client side
        noteDoc = new Note(note)
        await noteDoc.save()
        // add note id to relevant project
        const projectDoc = await Project.findById(noteDoc.project)
        projectDoc.notes.push(noteDoc._id)
        await projectDoc.save()
      }
    }
    if (action === NoteApiAction.REMOVE) {
    }
  } catch (error) {
    console.error(error)
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Database error', error })
  }

  let newToken: string = null
  // token (keep resetting their session length)
  if (!isGuestUser) newToken = generateAccessToken(userDoc.email)

  // populate the 'user' field if it is a user created note
  if (noteDoc.user && !noteDoc.populated('user'))
    await noteDoc.populate('user', 'username email').execPopulate()

  res.status(StatusCodes.OK).json({
    note: noteDoc.toObject(),
    token: newToken,
  })
}

const removeDoneNotes = async (
  res: NextApiResponse,
  userDoc: UserDocInterface,
  projectId: string
): Promise<void> => {
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
