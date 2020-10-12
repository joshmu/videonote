import isEmail from 'validator/lib/isEmail'
import normalizeEmail from 'validator/lib/normalizeEmail'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { extractUser } from '../../utils/apiHelpers'
import { generateAccessToken } from '../../utils/jwt'

import { connectToDatabase } from '@/utils/mongodb'

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
      settings: {
        playOffset: -4,
        showHints: true,
        seekJump: 10,
        sidebarWidth: 400,
        currentProjectId: null,
      },
      role: 'free',
      notes: '',
      password: hashedPassword,
      created: new Date(),
      updated: new Date(),
      deleted: null,
    })
    .then(({ ops }) => ops[0])

  // token
  const token = generateAccessToken(user.email)

  // 201 - created
  res.status(201).json({
    user: extractUser(user),
    token,
  })
}
