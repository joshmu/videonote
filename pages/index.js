import absoluteUrl from 'next-absolute-url'
import Cookies from 'universal-cookie'

import Layout from '@/components/Layout/Layout'
import Modals from '@/components/Modals/Modals'
import Notification from '@/components/Notification/Notification'
import Sidebar from '@/components/Sidebar/Sidebar'
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer'
import { GlobalProvider } from '@/context/globalContext'
import { TodoProvider } from '@/context/todoContext'
import { VideoProvider } from '@/context/videoContext'
import Overlay from '@/shared/Modal/Overlay'
import { fetcher } from '@/utils/clientHelpers'

// todo: theme highlight needs to be dynamic for both light and dark mode (300, 400, 700)
// todo: think about extending landing page
// todo: alert for empty video src is not working
// todo: double check alert for local video when it begins to fail
// todo: if date-fns doesn't serve us for the timer duration then just make our own
// todo: esc key to close modals
// todo: unify text with text components
// todo: staggerChildren integrated for list however potential an animatepresence clash is occurring? or it doesn't animate as the list data is dynamic.

// todo: drag progress bar to seek quickly
// todo: edit timestamp
// todo: on login, do occuassional clean up of 'removed' data if its older than... 2 weeks?

// todo: mute option

// todo: option to change password
// todo: forget password option?

// todo: only update settings for user when they are not default values

// todo: speech to text synthesis on actionInput
// todo: think about mobile variant

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

              <Overlay />
              <Modals />
              <Notification />
            </div>
          </Layout>
        </TodoProvider>
      </VideoProvider>
    </GlobalProvider>
  )
}

Main.getInitialProps = async ctx => {
  const cookies = new Cookies(
    ctx?.req?.headers?.cookie ? ctx.req.headers.cookie : null
  )
  const token = cookies.get('token')

  if (!token) {
    console.log('no token, redirecting...')
    // server
    ctx.res.writeHead(302, {
      Location: `/hello`,
    })
    ctx.res.end()
  }

  // request data with JWT token
  const { origin } = absoluteUrl(ctx.req)
  const url = `${origin}/api/auth`
  const body = {}
  const { res, data } = await fetcher(url, body, token)

  // if token is invalid
  if (res.status !== 200) {
    ctx.res.writeHead(302, {
      Location: `/login`,
    })
    ctx.res.end()
  }

  return { serverData: data }
}
