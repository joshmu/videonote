/**
 * @path /utils/apiHelpers.ts
 *
 * @project videonote
 * @file apiHelpers.ts
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Friday, 2nd October 2020
 * @modified Monday, 23rd November 2020 4:56:01 pm
 * @copyright © 2020 - 2020 MU
 */

// take only needed user fields to avoid sensitive ones (such as password)

export const extractUser = <T extends { password: string; created: string }>(
  user: T
): { [key: string]: any } => {
  if (!user) return null
  const { password, created, ...data } = user
  return {
    ...data,
  }
}

export const extractProject = <T extends { created: string; updated: string }>(
  project: T
): { [key: string]: any } => {
  if (!project) return null
  const { created, updated, ...data } = project
  return {
    ...data,
  }
}

export const extractPublicProject = <
  T extends { created: string; updated: string; userIds: string[] }
>(
  project: T
): { [key: string]: any } => {
  if (!project) return null
  const { created, updated, userIds, ...data } = project
  return {
    ...data,
  }
}
