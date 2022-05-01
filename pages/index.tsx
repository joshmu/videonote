/**
 * @path /pages/index.tsx
 *
 * @project videonote
 * @file index.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Sunday, 1st May 2022 12:56:22 pm
 * @copyright © 2020 - 2020 MU
 */

import { StatusCodes } from 'http-status-codes'
import { NextPage, NextPageContext } from 'next'
import absoluteUrl from 'next-absolute-url'
import Cookies from 'universal-cookie'

import { Layout } from '@/components/Layout/Layout'
import { Modals } from '@/components/Modals/Modals'
import { Notification } from '@/components/Notification/Notification'
import { Sidebar } from '@/components/Sidebar/Sidebar'
import { VideoPlayer } from '@/components/VideoPlayer/VideoPlayer'
import { ControlsProvider } from '@/context/controlsContext'
import { GlobalProvider } from '@/context/globalContext'
import { NoteProvider } from '@/context/noteContext'
import { VideoProvider } from '@/context/videoContext'
import { AppContainer } from '@/layout/AppContainer/AppContainer'
import { Overlay } from '@/shared/Modal/Overlay'
import { fetcher } from '@/utils/clientHelpers'
import { useUser, withPageAuthRequired } from '@auth0/nextjs-auth0'
import { useEffect, useState } from 'react'

interface Props {}

const IndexPage: NextPage<Props> = ({}) => {
  const [serverData, setServerData] = useState(null)
  const { user } = useUser()

  async function getData(user) {
    const { data } = await fetcher('/api/login', { email: user.email })
    setServerData(data)
  }

  useEffect(() => {
    // todo: use 'sub' instead of 'email' in all DB records
    // user 'sub' is the unique auth0 ID for the user which we can use as reference for the DB
    if (!user || !user?.sub || serverData) return
    getData(user)
  }, [user])

  // todo: query db for userID
  // todo: if nothing exists then create user project db
  // todo: refactor this logic to server side?

  if (!user || !serverData) return null

  return (
    <GlobalProvider serverData={serverData}>
      <VideoProvider>
        <NoteProvider>
          <ControlsProvider>
            <Layout>
              <AppContainer>
                <VideoPlayer />
                <Sidebar />
              </AppContainer>

              <Overlay />
              <Modals />
              <Notification />
            </Layout>
          </ControlsProvider>
        </NoteProvider>
      </VideoProvider>
    </GlobalProvider>
  )
}

/*
IndexPage.getInitialProps = async (ctx: NextPageContext) => {
  const cookies = new Cookies(
    ctx?.req?.headers?.cookie ? ctx.req.headers.cookie : null
  )
  const token = cookies.get('token')

  if (!token) {
    console.log('no token, redirecting...')
    // server
    ctx.res.writeHead(StatusCodes.MOVED_TEMPORARILY, {
      Location: `/hello`,
    })
    ctx.res.end()
    return
  }

  // request data with JWT token
  const { origin } = absoluteUrl(ctx.req)
  const url = `${origin}/api/auth`
  const body = {}
  const { res, data } = await fetcher(url, body, token)

  // if token is invalid
  if (res.status !== StatusCodes.OK) {
    ctx.res.writeHead(StatusCodes.MOVED_TEMPORARILY, {
      Location: `/login`,
    })
    ctx.res.end()
    return
  }

  return { serverData: data }
}
*/

// You can optionally pass your own `getServerSideProps` function into
// `withPageAuthRequired` and the props will be merged with the `user` prop
export const getServerSideProps = withPageAuthRequired()

export default IndexPage
