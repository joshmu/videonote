import isEmail from 'validator/lib/isEmail'
import Cookies from 'universal-cookie'

export const isValidCredentials = ({
  username = undefined,
  email,
  password,
  passwordConfirmation = password,
}) => {
  console.log({ email, password, passwordConfirmation })
  const validUsername = username === undefined || username.length > 2
  const validEmail = isEmail(email)
  const validPassword = password.length > 4 && password === passwordConfirmation
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
