import Layout from '../src/components/Layout'
import VideoPlayer from '../src/components/VideoPlayer/VideoPlayer'
import Sidebar from '../src/components/Sidebar/Sidebar'
import Modals from '../src/components/Modals/Modals'
import Notification from '../src/components/Notification/Notification'

// todo: speech to text synthesis on actionInput
// todo: easy share project (read only privledges option?, url link and no account required?)
// todo: prioritize speed of workflow
// todo: notification system
// todo: warning if bad local file
// todo: warning if using local file that you will not be able to share
// todo: export option
// todo: simplify colorscheme
// todo: formalize universal style components
// todo: think about mobile variant
// todo: auto focus on actionInput after project load
// todo: highlight (half highlight?) note closest to current play time, (whilst playing only?)

export default function Main() {
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
