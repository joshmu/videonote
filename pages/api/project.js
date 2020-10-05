import { connectToDatabase } from '../../utils/mongodb'
import { extractUser } from '../../utils/apiHelpers'
import { authenticateToken, generateAccessToken } from '../../utils/jwt'
import { nanoid } from 'nanoid'
import mongo from 'mongodb'

export default async (req, res) => {
  // Gather the jwt access token from the request header
  let token = req.headers['authorization']
  // strip 'bearer'
  if (token) token = token.replace(/bearer /i, '')
  if (!token) {
    return res.status(401).json({ msg: 'No token. Authorization denied.' })
  }

  const { action, project } = req.body

  let email
  try {
    email = await authenticateToken(token)
  } catch (err) {
    console.error(err.message)
    return res.status(401).json({ msg: 'Invalid token' })
  }

  // connect db
  const { db } = await connectToDatabase()

  // get user
  const user = await db.collection('users').findOne({
    email,
  })

  try {
    if (action === 'create') {
      await createProject(project, user, db)
    }

    if (action === 'update') {
      await updateProject(project, user, db)
    }
    if (action === 'remove') {
      const projectData = { ...project, removed: new Date() }
      await updateProject(projectData, user, db)
    }
    if (!action) {
      return res.status(400).json({ msg: 'Action not specified' })
    }
  } catch (error) {
    console.error(error)
  }

  // get all projects with user's id
  const projects = await getUserProjects(user._id, db)

  // token
  const newToken = generateAccessToken(user.email)

  res.status(200).json({
    user: extractUser(user),
    projects,
    token: newToken,
  })
}

const createProject = async (project, user, db) => {
  return db
    .collection('projects')
    .insertOne({
      _id: nanoid(12),
      title: project.title,
      src: project.src,
      todos: [],
      notes: '',
      private: true,
      userIds: [user._id],
      created: new Date(),
      updated: new Date(),
      removed: null,
    })
    .then(({ ops }) => ops[0])
}
const updateProject = async (project, user, db) => {
  if (!(await userOwnsProject(project, user, db))) {
    console.log('user does not own this project')
    return
  }

  const { _id, ...data } = project

  return db.collection('projects').updateOne(
    { _id: _id },
    { $set: data }
    // { upsert: true }
  )
}
const userOwnsProject = async (project, user, db) => {
  // todo: convert this entirey to mongo driver
  const foundProject = await db
    .collection('projects')
    .findOne({ _id: project._id })
  return foundProject.userIds.includes(user._id)
  // return (
  //   db
  //     .collection('projects')
  //     .find({
  //       $and: [
  //         {
  //           _id: project._id,
  //         },
  //         {
  //           $expr: {
  //             $in: [user._id, '$userIds'],
  //           },
  //         },
  //       ],
  //     })
  //     .count() > 0
  // )
}
export const getUserProjects = async (userId, db) => {
  return db
    .collection('projects')
    .find({
      $expr: {
        $in: [userId, '$userIds'],
      },
    })
    .filter({
      removed: { $eq: null },
    })
    .toArray()
}
