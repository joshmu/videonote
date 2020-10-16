import bcrypt from 'bcryptjs'
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
  const globalResponseMsg = 'Your Email or Password is incorrect.'
  if (email && !isEmail(email)) {
    // res.status(400).json({ msg: 'The email you entered is invalid.' })
    res.status(400).json({ msg: globalResponseMsg })
    return
  }
  if (!password) {
    res.status(400).json({ msg: 'Missing field(s)' })
    return
  }
  if ((await User.countDocuments({ email })) === 0) {
    // res.status(404).json({ msg: 'Email not found, registration required.' })
    res.status(404).json({ msg: globalResponseMsg })
    return
  }

  // get user via email
  const user = await User.findOne({ email }).lean()

  // compare passwords
  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    // return res.status(401).json({ msg: 'Password is incorrect.' })
    return res.status(401).json({ msg: globalResponseMsg })
  }

  // token
  const token = generateAccessToken(user.email)

  // 302 - found
  return res.status(302).json({
    user: extractUser(user),
    token,
  })
}
