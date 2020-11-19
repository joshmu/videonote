import bcrypt from 'bcryptjs'
import { StatusCodes } from 'http-status-codes'
import { NextApiRequest, NextApiResponse } from 'next'

import { Project, Share } from '@/utils/mongoose'

import { ProjectDocInterface, ShareDocInterface } from './project'

// GET 1 PROJECT
export default async (req: NextApiRequest, res: NextApiResponse) => {
  // project share id
  const { shareUrl, password } = req.body

  // get project
  let projectDoc: ProjectDocInterface
  let shareDoc: ShareDocInterface
  try {
    shareDoc = await Share.findOne({ url: shareUrl })

    if (shareDoc.password.length > 0) {
      // 'shared project password required'

      if (password) {
        // compare passwords
        const match = await bcrypt.compare(password, shareDoc.password)
        console.log({ match })
        if (!match) {
          return res.status(StatusCodes.OK).json({ msg: 'password incorrect' })
        }
      } else {
        // else
        return res
          .status(StatusCodes.OK)
          .json({ msg: 'shared project password required' })
      }
    }

    projectDoc = await Project.findById(shareDoc.project)
      .populate([
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
      .lean()
  } catch (error) {
    // no project found
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Share url does not exist.' })
  }

  // compose output data in the same shape as the entire user object
  const data = {
    user: {
      projects: [projectDoc],
    },
  }

  // send data
  res.status(StatusCodes.OK).json(data)
}
