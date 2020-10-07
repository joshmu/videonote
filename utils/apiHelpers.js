// take only needed user fields to avoid sensitive ones (such as password)
export const extractUser = user => {
  if (!user) return null
  const { password, removed, created, updated, notes, ...data } = user
  return {
    ...data,
  }
}

export const extractProject = project => {
  if (!project) return null
  const { removed, created, updated, notes, ...data } = project
  return {
    ...data,
  }
}
