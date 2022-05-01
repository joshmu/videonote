/**
 * @path /src/components/HelloPage/User/User.tsx
 *
 * @project videonote
 * @file User.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Sunday, 1st May 2022 11:25:34 am
 * @modified Sunday, 1st May 2022 11:25:43 am
 * @copyright © 2020 - 2020 MU
 */

import { useUser } from '@auth0/nextjs-auth0'

export const User = () => {
  const { user, error, isLoading } = useUser()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>{error.message}</div>

  if (!user) return null

  return (
    <div id='overview' className='container px-4 pt-20 mx-auto my-12'>
      <div>
        <img src={user.picture} alt={user.name} />
        <h2>{user.name}</h2>
        <p>{user.email}</p>
      </div>
    </div>
  )
}
