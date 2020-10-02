// take only needed user fields to avoid sensitive ones (such as password)
export const extractUser = user => {
  if (!user) return null
  const { password, deleted, notes, ...data } = user
  return {
    ...data,
  }
}
