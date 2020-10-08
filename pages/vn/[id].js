import Layout from '../../src/components/Layout'
import VideoPlayer from '../../src/components/VideoPlayer/VideoPlayer'
import Sidebar from '../../src/components/Sidebar/Sidebar'
import Modals from '../../src/components/Modals/Modals'
import Notification from '../../src/components/Notification/Notification'
import { GlobalProvider } from '../../src/context/globalContext'
import Overlay from '../../src/components/shared/Overlay'
import absoluteUrl from 'next-absolute-url'
import { VideoProvider } from '../../src/context/videoContext'
import { TodoProvider } from '../../src/context/todoContext'
import { fetcher } from '../../utils/clientHelpers'

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
