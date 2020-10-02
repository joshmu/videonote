import { useEffect } from 'react'
import Layout from '../src/components/Layout'
import VideoPlayer from '../src/components/VideoPlayer/VideoPlayer'
import Sidebar from '../src/components/Sidebar/Sidebar'
import Modals from '../src/components/Modals/Modals'
import Notification from '../src/components/Notification/Notification'
import { useGlobalContext } from '../src/context/globalContext'
import Overlay from '../src/components/shared/Overlay'
import Cookies from 'universal-cookie'
import absoluteUrl from 'next-absolute-url'

// todo: speech to text synthesis on actionInput
// todo: decide on 'services' or 'lib' or 'utils' folder? and where?
// todo: easy share project (read only privledges option?, url link and no account required?)
// accounts which can share public readonly of their project, viewers can only mark off notes but cannot create projects or notes
// todo: prioritize speed of workflow
// todo: think about mobile variant
// todo: method to autofocus, auto focus on actionInput after project load, (do this especially on SHIFT when expanded video)

// todo: show locate video file button
// todo: warning if using local file that you will not be able to share

// todo: use date-fns for times?
// todo: autoplay when note is selected? (settings option)
// todo: mute option
// todo: export option

// todo: best way to store date in mongodb

export default function Main({ serverData }) {
  const { handleInitialServerData } = useGlobalContext()

  // on initial load handle server response
  useEffect(() => {
    handleInitialServerData(serverData)
  }, [])

  return (
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
      Location: `/`,
    })

    ctx.res.end()
    return
  }

  // request data with JWT token
  const { origin } = absoluteUrl(ctx.req)
  const body = { token }
  const res = await fetch(`${origin}/api/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  // if token is invalid
  if (res.status !== 200) {
    ctx.res.writeHead(302, {
      Location: `/login`,
    })
    ctx.res.end()
    return
  }

  // response data to pass to vn
  const data = await res.json()

  return { serverData: data }
}
