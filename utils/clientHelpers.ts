import Cookies from 'universal-cookie'
import isEmail from 'validator/lib/isEmail'

type IsValidCredentialsType = {
  email: string
  username?: string
  password?: string
  password2?: string
  passwordRequired?: boolean
  addAlert: (a: object) => {}
}

export const isValidCredentials = ({
  email,
  username = email,
  password = '',
  password2 = password,
  passwordRequired = true,
  addAlert,
}: IsValidCredentialsType): boolean => {
  let isValid = true

  if (!checkEmail(email)) {
    addAlert({ type: 'error', msg: 'Email in invalid.' })
    isValid = false
  }
  if (!checkUsername(username)) {
    addAlert({
      type: 'error',
      msg: 'Username must be at least 3 characters long',
    })
    isValid = false
  }
  if (passwordRequired) {
    if (!checkPassword(password)) {
      addAlert({
        type: 'error',
        msg: 'Password needs to be at least 5 characters long.',
      })
      isValid = false
    }
    if (!checkPasswordMatch(password, password2)) {
      addAlert({ type: 'error', msg: 'Passwords do not match.' })
      isValid = false
    }
  }

  return isValid
}

export const checkEmail = (txt: string): boolean => {
  return isEmail(txt)
}
export const checkUsername = (txt: string): boolean => {
  return txt.length > 5
}
export const checkPassword = (txt: string): boolean => {
  return txt.length > 5
}
export const checkPasswordMatch = (
  password1: string,
  password2: string
): boolean => {
  return password1 === password2
}

export const handleJwtToken = (token: string): void => {
  // save token in cookie for subsequent requests
  const cookies = new Cookies()
  cookies.set('token', token, { path: '/' })
}

export const fetcher = async (
  url: string,
  body: object,
  token: string | boolean = false
) => {
  if (!token) {
    const cookies = new Cookies()
    token = cookies.get('token')
  }

  const headers: { [key: string]: string } = {
    'Content-Type': 'application/json',
  }
  // include 'token' in the header if we have one available
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const data = await res.json()

  if (data.token) handleJwtToken(data.token)

  return { res, data }
}

export const formatDuration = (secStr: string): string => {
  const totalSecs = +secStr
  const sec = Math.floor(totalSecs % 60)
  const min = Math.floor(totalSecs / 60)
  return `${min}:${sec < 10 ? '0' + sec : sec}`
}
