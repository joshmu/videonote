import bcrypt from 'bcryptjs'
import { StatusCodes } from 'http-status-codes'
import isEmail from 'validator/lib/isEmail'
import normalizeEmail from 'validator/lib/normalizeEmail'

import { extractUser } from '@/utils/apiHelpers'
import { generateAccessToken } from '@/utils/jwt'
import { User } from '@/utils/mongoose'

export default async (req, res) => {
  // get user data
  const { password } = req.body
  const email = normalizeEmail(req.body.email)

  // validate
  if (email && !isEmail(email)) {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'The email you entered is invalid.' })
    return
  }
  if (!password) {
    res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Missing field(s)' })
    return
  }
  if ((await User.countDocuments({ email })) > 0) {
    res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: 'The email has already been used.' })
    return
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // insert
  const userDoc = new User({
    email: email,
    username: email,
    password: hashedPassword,
  })

  try {
    await userDoc.save()
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Database Error' })
  }

  // token
  const token = generateAccessToken(userDoc.email)

  // 201 - created
  res.status(StatusCodes.CREATED).json({
    user: extractUser(await userDoc.toObject()),
    token,
  })
}
