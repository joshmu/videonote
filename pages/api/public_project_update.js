import { StatusCodes } from 'http-status-codes'

import { Project } from '@/utils/mongoose'

export default async (req, res) => {
  // project
  const { project } = req.body

  // get project
  const projectDoc = await Project.findById(project._id)
  // not found
  if (projectDoc === null)
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: 'Project does not exist.' })

  // project is public
  if (projectDoc.isPrivate)
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: 'Project is private.' })

  try {
    // update project
    //* only allow notes to be updated
    await projectDoc.updateOne({ $set: { notes: project.notes } })
    await projectDoc.save()
  } catch (error) {
    console.error(error)
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message })
  }

  // send data
  res.status(StatusCodes.OK).json({
    msg: `Success, project updated. (${projectDoc._id})`,
  })
}
