/**
 * Generate Access Token Secret
 * generate token secret > require('crypto').randomBytes(64).toString('hex')
 */

const jwt = require('jsonwebtoken')

export const authenticateToken = async token => {
  const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET)
  // @ts-ignore
  return decoded.email
}

export const generateAccessToken = email => {
  // expires after half and hour (1800 seconds = 30 minutes)
  const data = { email }
  return jwt.sign(data, process.env.JWT_TOKEN_SECRET, { expiresIn: 60 })
}
