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

export const extractUser = <
  T extends { password?: unknown; createdAt?: unknown; updatedAt?: unknown },
>(
  user: T,
): { [key: string]: any } => {
  if (!user) return null;
  const { password: _password, createdAt: _createdAt, updatedAt: _updatedAt, ...data } = user;
  return data;
};
