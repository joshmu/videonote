import Cookies from 'universal-cookie'
import isEmail from 'validator/lib/isEmail'

export const isValidCredentials = ({
  username = undefined,
  email,
  password,
  passwordConfirmation,
}) => {
  const validUsername = username === undefined || username.length > 2
  const validEmail = isEmail(email)
  console.log({ password, passwordConfirmation })
  const validPassword =
    password.length > 4 &&
    (passwordConfirmation ? password === passwordConfirmation : true)
  return validUsername && validEmail && validPassword
}

export const handleJwtToken = token => {
  // save token in cookie for subsequent requests
  const cookies = new Cookies()
  cookies.set('token', token, { path: '/' })
}

export const fetcher = async (url, body, token = false) => {
  if (!token) {
    const cookies = new Cookies()
    token = cookies.get('token')
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()

  if (data.token) handleJwtToken(data.token)

  return { res, data }
}

export const formatDuration = secStr => {
  const totalSecs = +secStr
  const sec = Math.floor(totalSecs % 60)
  const min = Math.floor(totalSecs / 60)
  return `${min}:${sec < 10 ? '0' + sec : sec}`
}
