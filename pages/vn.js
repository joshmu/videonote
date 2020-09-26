import { useEffect } from 'react'
import Layout from '../src/components/Layout'
import VideoPlayer from '../src/components/VideoPlayer/VideoPlayer'
import Sidebar from '../src/components/Sidebar/Sidebar'
import Modals from '../src/components/Modals/Modals'
import Notification from '../src/components/Notification/Notification'
import { useGlobalContext } from '../src/context/globalContext'

// todo: speech to text synthesis on actionInput
// todo: easy share project (read only privledges option?, url link and no account required?)
// accounts which can share public readonly of their project, viewers can only mark off notes but cannot create projects or notes
// todo: prioritize speed of workflow
// todo: warning if bad local file
// todo: warning if using local file that you will not be able to share
// todo: export option
// todo: simplify colorscheme
// todo: formalize universal style components
// todo: think about mobile variant
// todo: auto focus on actionInput after project load
// todo: highlight (half highlight?) note closest to current play time, (whilst playing only?)
// todo: mute option
// todo: autoplay when note is selected? (settings option)
// todo: convert styles to use primary & secondary

export default function Main() {
  const { account, login } = useGlobalContext()

  useEffect(() => {
    if (!account) login({ username: 'mu@joshmu.com' })
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
      </div>
    </Layout>
  )
}
