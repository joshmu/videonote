/**
 * Generate Access Token Secret
 * generate token secret > require('crypto').randomBytes(64).toString('hex')
 */

const jwt = require('jsonwebtoken')

const authenticateToken = (req, res, next) => {
  // Gather the jwt access token from the request header
  const token = req.headers['authorization']

  if (!token) {
    return res.status(401).json({ msg: 'No token. Authorization denied.' })
  }

  try {
    // verify token
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
    console.log({ decoded })
    // @ts-ignore
    req.email = decoded.email
    next()
  } catch (err) {
    console.error(err.message)
    res.status(401).json({ msg: 'Invalid token' })
  }
}

const generateAccessToken = email => {
  // expires after half and hour (1800 seconds = 30 minutes)
  return jwt.sign(email, process.env.TOKEN_SECRET, { expiresIn: '1800s' })
}

module.exports = { authenticateToken, generateAccessToken }
