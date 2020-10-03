import { connectToDatabase } from '../../utils/mongodb'
import { extractUser } from '../../utils/apiHelpers'
import { authenticateToken, generateAccessToken } from '../../utils/jwt'

export default async (req, res) => {
  // Gather the jwt access token from the request header
  const token = req.headers['authorization']
  console.log('headers', { token })
  const { action, project } = req.body
  console.log({ action, project })

  if (!token) {
    return res.status(401).json({ msg: 'No token. Authorization denied.' })
  }

  let email
  try {
    email = await authenticateToken(token)
  } catch (err) {
    console.error(err.message)
    return res.status(401).json({ msg: 'Invalid token' })
  }

  // connect db
  const { db } = await connectToDatabase()

  // todo: multiple routes for different actions (CRUD)
  if (action === 'create') {
    createProject(project, db)
  }
  if (action === 'update') {
    updateProject(project, db)
  }
  if (action === 'delete') {
    deleteProject(project, db)
  }
  if (!action) {
    return res.status(400).json({ msg: 'Action not specified' })
  }

  // get user
  const user = await db.collection('users').findOne({
    email,
  })
  // todo: get all projects with user's id (which aren't deleted)
  // const projects = await db.collection('projects')...

  // token
  const newToken = generateAccessToken(user.email)

  res.status(200).json({
    user: extractUser(user),
    projects: [],
    token: newToken,
  })
}

const createProject = async (project, db) => {}
const updateProject = async (project, db) => {}
const deleteProject = async (project, db) => {}
