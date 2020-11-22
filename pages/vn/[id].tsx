/**
 * @path /pages/vn/[id].tsx
 *
 * @project videonote
 * @file [id].tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Thursday, 8th October 2020
 * @modified Sunday, 22nd November 2020 7:03:45 pm
 * @copyright © 2020 - 2020 MU
 */

import { StatusCodes } from 'http-status-codes'
import { NextPage } from 'next'
import absoluteUrl from 'next-absolute-url'

import { Layout } from '@/components/Layout/Layout'
import { Modals } from '@/components/Modals/Modals'
import Notification from '@/components/Notification/Notification'
import { Sidebar } from '@/components/Sidebar/Sidebar'
import { VideoPlayer } from '@/components/VideoPlayer/VideoPlayer'
import { ControlsProvider } from '@/context/controlsContext'
import { GlobalProvider } from '@/context/globalContext'
import { NoteProvider } from '@/context/noteContext'
import { VideoProvider } from '@/context/videoContext'
import { AppContainer } from '@/layout/AppContainer/AppContainer'
import { Overlay } from '@/shared/Modal/Overlay'

interface Props {
  serverData?: {}
}

const ShareProjectPage: NextPage<Props> = ({ serverData = {} }) => {
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

ShareProjectPage.getInitialProps = async ctx => {
  // get id
  const shareUrl = ctx.query.id

  // fetch config
  const { origin } = absoluteUrl(ctx.req)
  const url = `${origin}/api/public_project`
  const body = {
    shareUrl,
  }

  // request project
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  // if an error occurs, redirect
  if (res.status !== StatusCodes.OK) {
    ctx.res.writeHead(StatusCodes.MOVED_TEMPORARILY, {
      Location: `/hello`,
    })
    ctx.res.end()
    return
  }

  // parse
  const data = await res.json()

  // pass to react
  return { serverData: data }
}

export default ShareProjectPage
