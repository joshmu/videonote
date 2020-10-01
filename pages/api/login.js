import isEmail from 'validator/lib/isEmail'
import normalizeEmail from 'validator/lib/normalizeEmail'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { connectToDatabase } from '../../utils/mongodb'

export default async (req, res) => {
  // connect db
  const { db } = await connectToDatabase()

  // get user data
  const { password } = req.body
  const email = normalizeEmail(req.body.email)

  // validate
  if (email && !isEmail(email)) {
    res.status(400).json({ msg: 'The email you entered is invalid.' })
    return
  }
  if (!password) {
    res.status(400).json({ msg: 'Missing field(s)' })
    return
  }
  if ((await db.collection('users').countDocuments({ email })) === 0) {
    res.status(404).json({ msg: 'Email not found, registration required.' })
    return
  }

  // get user via email
  const user = await db.collection('users').findOne({
    email,
  })

  // compare passwords
  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    res.status(401).json({ msg: 'Password is incorrect.' })
  }

  // 302 - found
  res.status(302).json({
    user: extractUser(user),
  })
}

// take only needed user fields to avoid sensitive ones (such as password)
function extractUser(user) {
  if (!user) return null
  const { _id, email } = user
  return {
    _id,
    email,
  }
}
