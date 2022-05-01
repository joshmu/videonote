import bcrypt from 'bcryptjs'
import { StatusCodes } from 'http-status-codes'
import isEmail from 'validator/lib/isEmail'
import normalizeEmail from 'validator/lib/normalizeEmail'

import { extractUser } from '@/utils/apiHelpers'
import { generateAccessToken } from '@/utils/jwt'
import { User } from '@/utils/mongoose'

export default async (req, res) => {
  // get user data
  // todo-mu: remove temp pass
  console.log(`todo-mu: remove temp pass`)
  const { password = process.env.TEMP_PASS } = req.body
  const email = normalizeEmail(req.body.email)

  // validate
  const globalResponseMsg = 'Your Email and/or Password is incorrect.'

  // get user via email
  const user = await User.findOne({ email }).lean()

  // compare passwords
  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    // return res.status(401).json({ msg: 'Password is incorrect.' })
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: globalResponseMsg })
  }

  // token
  const token = generateAccessToken(user.email)

  // 302 - found
  return res.status(StatusCodes.MOVED_TEMPORARILY).json({
    user: extractUser(user),
    token,
  })
}
