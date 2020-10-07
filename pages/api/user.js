import { connectToDatabase } from '../../utils/mongodb'
import { extractUser } from '../../utils/apiHelpers'
import { authenticateToken, generateAccessToken } from '../../utils/jwt'

export default async (req, res) => {
  // Gather the jwt access token from the request header
  let token = req.headers['authorization']
  // strip 'bearer'
  if (token) token = token.replace(/bearer /i, '')
  if (!token) {
    return res.status(401).json({ msg: 'No token. Authorization denied.' })
  }

  const { action, user: userData } = req.body

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
    if (action === 'update') {
      await updateUser(user, userData, db)
    }
    if (action === 'remove') {
      const userData = { removed: new Date() }
      await updateUser(user, userData, db)
    }
    if (!action) {
      return res.status(400).json({ msg: 'Action not specified' })
    }
  } catch (error) {
    console.error(error)
  }

  // get updated user
  const updatedUser = await db.collection('users').findOne({
    email,
  })

  // token
  const newToken = generateAccessToken(updatedUser.email)

  res.status(200).json({
    user: extractUser(updatedUser),
    token: newToken,
  })
}

const updateUser = async (user, userData, db) => {
  const { _id } = user
  // form entire settings object if we are updating 'settings'
  if (userData.settings)
    userData.settings = { ...user.settings, ...userData.settings }

  return db.collection('users').updateOne(
    { _id: _id },
    {
      $set: {
        ...userData,
        updated: new Date(),
      },
    }
    // { upsert: true }
  )
}
