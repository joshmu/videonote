import { StatusCodes } from 'http-status-codes'

import { Project, Share } from '@/utils/mongoose'

// GET 1 PROJECT
export default async (req, res) => {
  // project share id
  const { shareUrl } = req.body

  // get project
  let projectDoc
  let shareDoc
  console.log('grab share url project', shareUrl)
  try {
    shareDoc = await Share.findOne({ url: shareUrl })
    projectDoc = await Project.findById(shareDoc.project)
      .populate([
        { path: 'notes', model: 'Note' },
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
