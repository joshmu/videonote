import { connectToDatabase } from '../../utils/mongodb'
import { extractUser } from '../../utils/apiHelpers'
import { authenticateToken } from '../../utils/jwt'

export default async (req, res) => {
  // Gather the jwt access token from the request header
  // const token = req.headers['authorization']
  // console.log('headers', { token })
  const { token } = req.body

  if (!token) {
    return res.status(401).json({ msg: 'No token. Authorization denied.' })
  }

  let email
  try {
    email = await authenticateToken(token)
  } catch (err) {
    console.error(err.message)
    res.status(401).json({ msg: 'Invalid token' })
  }

  // connect db
  const { db } = await connectToDatabase()

  // get user via email
  const user = await db.collection('users').findOne({
    email,
  })

  res.status(200).json({
    user: extractUser(user),
  })
}
