// take only needed user fields to avoid sensitive ones (such as password)
export const extractUser = user => {
  if (!user) return null
  const { password, created, ...data } = user
  return {
    ...data,
  }
}

export const extractProject = project => {
  if (!project) return null
  const { created, updated, ...data } = project
  return {
    ...data,
  }
}

export const extractPublicProject = project => {
  if (!project) return null
  const { created, updated, userIds, ...data } = project
  return {
    ...data,
  }
}
