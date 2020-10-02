// take only needed user fields to avoid sensitive ones (such as password)
export const extractUser = user => {
  if (!user) return null
  const { _id, email } = user
  return {
    _id,
    email,
  }
}
