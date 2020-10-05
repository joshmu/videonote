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
      createProject(project, user, db)
    }

    if (action === 'update') {
      updateProject(project, user, db)
    }
    if (action === 'delete') {
      deleteProject(project, user, db)
    }
    if (!action) {
      return res.status(400).json({ msg: 'Action not specified' })
    }
  } catch (error) {
    console.error(error)
  }

  // get all projects with user's id
  const projects = await getUserProjects(user._id, db)
  console.log({ projects })

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
      deleted: null,
    })
    .then(({ ops }) => ops[0])
}
const updateProject = async (project, user, db) => {
  if (!userOwnsProject(project, user)) return
  console.warn('todo')
}
const deleteProject = async (project, user, db) => {
  if (!userOwnsProject(project, user)) return
  console.warn('todo')
}
const userOwnsProject = (project, user) => {
  // todo: check user exists in project
  console.warn('todo')
  return true
}
export const getUserProjects = async (userId, db) => {
  // todo: (which aren't deleted)
  return db
    .collection('projects')
    .find({
      $expr: {
        $in: [userId, '$userIds'],
      },
    })
    .toArray()
}
