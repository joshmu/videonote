import Layout from '../src/components/Layout'
import VideoPlayer from '../src/components/VideoPlayer/VideoPlayer'
import Sidebar from '../src/components/Sidebar/Sidebar'
import Modals from '../src/components/Modals/Modals'
import Notification from '../src/components/Notification/Notification'
import { GlobalProvider } from '../src/context/globalContext'
import Overlay from '../src/components/shared/Overlay'
import Cookies from 'universal-cookie'
import absoluteUrl from 'next-absolute-url'
import { VideoProvider } from '../src/context/videoContext'
import { TodoProvider } from '../src/context/todoContext'
import { fetcher } from '../utils/clientHelpers'

// todo: place notifications above the overlay

// todo: when page is inactive and we start using it again, check JWT? and boot if expired
// todo: keep giving back refreshed JWT during usage?
// todo: on sign out, remove token in cookies

// todo: edit timestamp
// todo: use date-fns for times?
// todo: drag progress bar to seek quickly
// todo: method to autofocus, auto focus on actionInput after project load, (do this especially on SHIFT when expanded video)
// todo: autoplay when note is selected? (settings option)
// todo: mute option
// todo: export option

// todo: option to change password
// todo: forget password option?

// todo: only update settings for user when they are not default values
// todo: best way to store date in mongodb
// todo: on login, do occuassional clean up of 'removed' data if its older than... 2 weeks?

// todo: speech to text synthesis on actionInput
// todo: decide on 'services' or 'lib' or 'utils' folder? and where?
// users accounts can share public readonly of their project, viewers can only mark off notes but cannot create projects or notes
// todo: prioritize speed of workflow
// todo: think about mobile variant

// todo: show locate video file button

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
    return
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
    return
  }

  return { serverData: data }
}
