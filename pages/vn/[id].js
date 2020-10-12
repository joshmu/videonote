import absoluteUrl from 'next-absolute-url'

import Layout from '@/components/Layout/Layout'
import Modals from '@/components/Modals/Modals'
import Notification from '@/components/Notification/Notification'
import Sidebar from '@/components/Sidebar/Sidebar'
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer'
import { GlobalProvider } from '@/context/globalContext'
import { TodoProvider } from '@/context/todoContext'
import { VideoProvider } from '@/context/videoContext'
import Overlay from '@/shared/Overlay'

export default function Main({ serverData }) {
  return (
    <GlobalProvider serverData={serverData}>
      <VideoProvider>
        <TodoProvider>
          <Layout>
            <div className='flex flex-col w-full h-screen overflow-hidden'>
              {/* <div className='text-3xl'>navbar</div> */}

              <div className='flex flex-1 w-full h-full'>
                <VideoPlayer />
                <Sidebar />
              </div>

              <Modals />
              <Notification />
              <Overlay />
            </div>
          </Layout>
        </TodoProvider>
      </VideoProvider>
    </GlobalProvider>
  )
}

Main.getInitialProps = async ctx => {
  // get id
  const projectId = ctx.query.id

  // fetch config
  const { origin } = absoluteUrl(ctx.req)
  const url = `${origin}/api/public_project`
  const body = {
    id: projectId,
  }

  // request project
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  // parse
  const data = await res.json()

  console.log({ data })

  // pass to react
  return { serverData: data }
}
