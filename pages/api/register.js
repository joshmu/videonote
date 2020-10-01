// import nextConnect from 'next-connect';
import isEmail from 'validator/lib/isEmail'
import normalizeEmail from 'validator/lib/normalizeEmail'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
// import middleware from '../../middlewares/middleware';
// import { extractUser } from '../../lib/api-helpers'

import { connectToDatabase } from '../../utils/mongodb'

// const handler = nextConnect();

// handler.use(middleware);

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
  if ((await db.collection('users').countDocuments({ email })) > 0) {
    res.status(403).json({ msg: 'The email has already been used.' })
    return
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // insert
  const user = await db
    .collection('users')
    .insertOne({
      _id: nanoid(12),
      email,
      username: email,
      projectIds: [],
      password: hashedPassword,
      created: Date.now(),
      updated: Date.now(),
      deleted: null,
    })
    .then(({ ops }) => ops[0])

  // 201 - created
  res.status(201).json({
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
