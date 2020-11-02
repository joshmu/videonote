import { StatusCodes } from 'http-status-codes'
import absoluteUrl from 'next-absolute-url'

import Layout from '@/components/Layout/Layout'
import Modals from '@/components/Modals/Modals'
import Notification from '@/components/Notification/Notification'
import Sidebar from '@/components/Sidebar/Sidebar'
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer'
import { GlobalProvider } from '@/context/globalContext'
import { NoteProvider } from '@/context/noteContext'
import { VideoProvider } from '@/context/videoContext'
import AppContainer from '@/layout/AppContainer/AppContainer'
import Overlay from '@/shared/Modal/Overlay'

export default function Main({ serverData }) {
  return (
    <GlobalProvider serverData={serverData}>
      <VideoProvider>
        <NoteProvider>
          <Layout>
            <div className='flex flex-col w-full h-screen overflow-hidden'>
              {/* <div className='text-3xl'>navbar</div> */}

              <AppContainer>
                <VideoPlayer />
                <Sidebar />
              </AppContainer>

              <Modals />
              <Notification />
              <Overlay />
            </div>
          </Layout>
        </NoteProvider>
      </VideoProvider>
    </GlobalProvider>
  )
}

Main.getInitialProps = async ctx => {
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
