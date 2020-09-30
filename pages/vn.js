import { useEffect } from 'react'
import Layout from '../src/components/Layout'
import VideoPlayer from '../src/components/VideoPlayer/VideoPlayer'
import Sidebar from '../src/components/Sidebar/Sidebar'
import Modals from '../src/components/Modals/Modals'
import Notification from '../src/components/Notification/Notification'
import { useGlobalContext } from '../src/context/globalContext'
import Overlay from '../src/components/shared/Overlay'

// todo: speech to text synthesis on actionInput
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
        <Overlay />
      </div>
    </Layout>
  )
}
