import Cookies from 'universal-cookie'
import isEmail from 'validator/lib/isEmail'

export const isValidCredentials = ({
  email,
  username = email,
  password = '',
  password2 = password,
  passwordRequired = true,
  addAlert,
}) => {
  const validEmail = isEmail(email)
  const validUsername = username.length >= 3
  const validPassword = password.length >= 5
  const validPasswordMatch = password === password2
  let isValid = true

  if (!validEmail) {
    addAlert({ type: 'error', msg: 'Email in invalid.' })
    isValid = false
  }
  if (!validUsername) {
    addAlert({
      type: 'error',
      msg: 'Username must be at least 3 characters long',
    })
    isValid = false
  }
  if (passwordRequired) {
    if (!validPassword) {
      addAlert({
        type: 'error',
        msg: 'Password needs to be at least 5 characters long.',
      })
      isValid = false
    }
    if (!validPasswordMatch) {
      addAlert({ type: 'error', msg: 'Passwords do not match.' })
      isValid = false
    }
  }

  return isValid
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
