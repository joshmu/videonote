import { useEffect } from 'react'
import Layout from '../src/components/Layout'
import VideoPlayer from '../src/components/VideoPlayer/VideoPlayer'
import Sidebar from '../src/components/Sidebar/Sidebar'
import { useGlobalContext } from '../src/context/globalContext'
import Modals from '../src/components/Modals/Modals'

// todo: speech to text synthesis on actionInput
// todo: load local file
// todo: easy share project (read only privledges option?, url link and no account required?)
// todo: prioritize speed of workflow

export default function Main() {
  const { account, login, loadProject } = useGlobalContext()

  // ! on initial load check if we have data and if not default for development
  useEffect(() => {
    if (!account) login({ username: 'mu@joshmu.com' })
    loadProject()
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
      </div>
    </Layout>
  )
}
