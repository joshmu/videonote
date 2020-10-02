import isEmail from 'validator/lib/isEmail'

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
