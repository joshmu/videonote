import Layout from '../src/components/Layout'
import VideoPlayer from '../src/components/VideoPlayer/VideoPlayer'
import Sidebar from '../src/components/Sidebar/Sidebar'
import ProjectModal from '../src/components/ProjectModal/ProjectModal'
import AccountModal from '../src/components/AccountModal/AccountModal'

export default function Main() {
  return (
    <Layout>
      <div className='flex flex-col w-full h-screen overflow-hidden'>
        {/* <div className='text-3xl'>navbar</div> */}

        <div className='flex flex-1 w-full h-full'>
          <VideoPlayer />
          <Sidebar />
        </div>

        <AccountModal />
        <ProjectModal />
      </div>
    </Layout>
  )
}
