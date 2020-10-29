import { StatusCodes } from 'http-status-codes'

import { extractProject, extractUser } from '@/utils/apiHelpers'
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

  const { action, project } = req.body

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
    if (action === 'create') {
      const projectDoc = await createProject(project, userDoc)

      // add project id to user's projectId's list
      userDoc.projectIds.push(projectDoc._id)
      await userDoc.save()
    }

    if (action === 'update') {
      await updateProject(project, userDoc)
    }
    if (action === 'remove') {
      // get projectDoc
      const projectDoc = await Project.findById(project._id)

      // remove user's projectIds reference
      await userDoc.projectIds.pull(projectDoc._id)
      await userDoc.save()

      // remove project
      await projectDoc.remove()
    }
    if (!action) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: 'Action not specified' })
    }
  } catch (error) {
    console.error(error)
  }

  // get all projects with user's id
  let updatedProjects = []
  if (userDoc.projectIds.length > 0) {
    updatedProjects = await Project.find({ _id: userDoc.projectIds }).lean()
  }

  // token (keep resetting their session length)
  const newToken = generateAccessToken(userDoc.email)

  res.status(StatusCodes.OK).json({
    user: extractUser(await userDoc.toObject()),
    projects: updatedProjects.map(project => extractProject(project)),
    token: newToken,
  })
}

const createProject = async (projectData, userDoc) => {
  // create project
  const projectDoc = new Project({
    title: projectData.title,
    src: projectData.src,
    userIds: [userDoc._id],
  })

  await projectDoc.save()

  return projectDoc
}

const updateProject = async (projectData, userDoc) => {
  if (!(await userOwnsProject(projectData, userDoc))) {
    console.log('user does not own this project')
    return
  }

  // remove the id and any nested array/object
  const { _id, ...data } = projectData

  const projectDoc = await Project.findByIdAndUpdate(
    _id,
    { $set: data },
    { new: true }
  )

  return projectDoc
}

const userOwnsProject = async (project, userDoc) => {
  return Project.findById(project._id).then(projectDoc => {
    return projectDoc.userIds.includes(userDoc._id)
  })
}
