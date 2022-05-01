/**
 * @path /pages/api/project.ts
 *
 * @project videonote
 * @file project.ts
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Sunday, 1st May 2022 12:54:56 pm
 * @copyright © 2020 - 2020 MU
 */

import bcrypt from 'bcryptjs'
import { StatusCodes } from 'http-status-codes'
import { NextApiRequest, NextApiResponse } from 'next'

import {
  ProjectApiActions,
  ProjectDocInterface,
  ShareDocInterface,
} from '@/shared/types'
import { authenticateToken, generateAccessToken } from '@/utils/jwt'
import { Note, Project, Share, User } from '@/utils/mongoose'

export default async (req: NextApiRequest, res: NextApiResponse) => {
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
  let email: string
  try {
    email = authenticateToken(token)
  } catch (err) {
    console.error(err.message)
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Invalid token' })
  }

  // get user
  const userDoc = await User.findOne({ email })

  // data passed
  const { action, project } = req.body
  // todo: project information not expanded properly
  console.log('>>>', req.body)

  let projectDoc: ProjectDocInterface
  try {
    switch (action) {
      case ProjectApiActions.GET:
        projectDoc = await getEntireProject({
          _id: project._id,
          user: userDoc._id,
        })
        break

      case ProjectApiActions.CREATE:
        projectDoc = new Project({
          ...project,
          user: userDoc._id,
        })
        await projectDoc.save()

        // add project id to user's projectId's list
        userDoc.projects.push(projectDoc._id)
        await userDoc.save()
        break

      case ProjectApiActions.UPDATE:
        // remove the id and any nested array/object
        const { _id, ...data } = project

        // find project by both project and user _id
        projectDoc = await Project.findOneAndUpdate(
          { _id, user: userDoc._id },
          { $set: data },
          { new: true }
        )
        break

      case ProjectApiActions.SHARE:
        console.log('action: share')
        // current project user is working on
        projectDoc = await Project.findOne({
          _id: project._id,
          user: userDoc._id,
        })

        // additional data for 'share' action
        const shareData = req.body.share

        let shareDoc: ShareDocInterface
        // if the projectDoc contains a 'share' ref _id then we are sharing and we just need to update
        if (projectDoc.share) {
          console.log('share project exists')
          shareDoc = await Share.findById(projectDoc.share)
          // hash password if we are given one
          if (shareData.password.length > 0)
            shareData.password = await bcrypt.hash(shareData.password, 10)
          // update share project doc
          await shareDoc.updateOne({ $set: shareData })
          await shareDoc.save()
          // assign updated version
          shareDoc = await Share.findById(shareDoc._id)
          // update projectDoc with populated 'share' which will be handed back
          projectDoc = await Project.findOne({
            _id: project._id,
            user: userDoc._id,
          }).populate({ path: 'share', model: 'Share' })
        } else {
          console.log('create share project')

          // hash password if one is provided and overwrite
          if (shareData.password.length > 0)
            shareData.password = await bcrypt.hash(shareData.password, 10)

          try {
            // create share doc
            shareDoc = await Share.create({
              ...shareData,
              project: projectDoc._id,
              user: userDoc._id,
            })
          } catch (error) {
            console.error(error)
            return res
              .status(StatusCodes.INTERNAL_SERVER_ERROR)
              .json({ msg: 'Specified share project url is taken.', error })
          }
          // add reference to project
          projectDoc.share = shareDoc._id
          await projectDoc.save()
          // reassign projectDoc as save() does not return updated version plus populate all avail fields
          projectDoc = await Project.findById(projectDoc._id)
            .populate({
              path: 'notes',
              model: 'Note',
            })
            .populate({
              path: 'share',
              model: 'Share',
            })
        }
        break

      case ProjectApiActions.REMOVE_SHARE:
        // current project user is working on
        projectDoc = await Project.findOne({
          _id: project._id,
          user: userDoc._id,
        })

        // additional data for 'share' action
        const shareInfo = req.body.share
        await Share.deleteOne({
          _id: shareInfo._id,
          user: userDoc._id,
          project: projectDoc._id,
        })

        // remove reference to share in 'project'
        projectDoc.share = null
        await projectDoc.save()

        // token (keep resetting their session length)
        const newToken = generateAccessToken(userDoc.email)

        projectDoc = await getEntireProject({
          _id: projectDoc._id,
        })

        return res.status(StatusCodes.OK).json({
          token: newToken,
          project: projectDoc.toObject(),
        })

        break

      case ProjectApiActions.REMOVE:
        // get projectDoc via project and user _id
        projectDoc = await Project.findOne({
          _id: project._id,
          user: userDoc._id,
        })

        // remove all notes associated to project
        await Note.deleteMany({
          project: projectDoc._id,
        })

        // remove all shared documents to the project
        await Share.deleteMany({
          project: projectDoc._id,
        })

        // remove user's reference to the project
        await userDoc.projects.pull(projectDoc._id)
        await userDoc.save()

        // remove project
        await projectDoc.remove()

        // token (keep resetting their session length)
        const newTokenFromRemoveAction = generateAccessToken(userDoc.email)

        return res.status(StatusCodes.OK).json({
          // toObject method does not work on removed/deleted mongoose document
          project: projectDoc,
          token: newTokenFromRemoveAction,
        })
        break

      default:
        // no action
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

const getEntireProject = async (query: {
  [key: string]: any
}): Promise<ProjectDocInterface> => {
  return Project.findOne(query).populate([
    {
      path: 'notes',
      model: 'Note',
      populate: {
        path: 'user',
        model: 'User',
        select: 'username email',
      },
    },
    { path: 'share', model: 'Share' },
  ])
}
