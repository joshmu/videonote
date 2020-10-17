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

// todo: double check alert for local video when it begins to fail
// todo: alert for empty video src is not working

// todo: if date-fns doesn't serve us for the timer duration then just make our own
// todo: esc key to close modals
// todo: unify text with text components
// todo: staggerChildren integrated for list however potential an animatepresence clash is occurring? or it doesn't animate as the list data is dynamic.

// todo: think about extending landing page
// todo: insert an accept cookies msg? or should we avoid cookies so we don't need this?
// todo: offer restrictation on sharing to avoid other users adding their own notes (editable) (DB)
// todo: offer public url however password protected (DB)

// todo: create docker instance for demo purposes?

// todo: drag progress bar to seek quickly
// todo: edit timestamp

// todo: mute option

// todo: option to change password
// todo: forget password option?

// todo: speech to text synthesis on actionInput
// todo: more user friendly sharing? project title instead? (and when clash then add random suffix?) or half id? unique project title specifically for sharing?
// todo: think about mobile variant

// todo: handle an audio file instead of a video file?
// todo: naming scheme which can cover using audio?

// todo: provide option for user to cancel notification messages? longer for project listing?
// todo: changing password in user account modal produces error page
// todo: understand basic ux rules
// todo: email account cannot handle full stops?  (is this normalisation occurring on the backend?)
// todo: confirmation modal for all 'delete' actions (whenever action is irreversible)
// todo: undo action for deleted projects and notes?
// todo: detect new user and bring up welcome modal detailing workflow
// todo: when using localStorage use app namespace prefix? ie. vn:theme
// todo: slide in sidebar on load rather than the content of it?
// todo: detect new user on signin and defer to register modal
// todo: add about information to /hello
// todo: create new project needs correct validation (compare to currentProjectModal)
// todo: multi users per project > check project usersIds before removing a project from db (DB: primary owner, who can also have extended control?) Multi users will have the project in their collection
// todo: playback speed in settings and smartcontrol shortcut with '<' '>' (DB)
// todo: sidebarWidth specification via settings
// todo: initialSidebarWidth based on user screen size
// todo: mark the video time line where notes are placed
// todo: when selecting timestamp edit then type or drag video playhead to change
// todo: offer ability to reply to a note? (DB)
// todo: project selection includes video thumbnail? (only for url based videos)
// todo: multiple export formats (excel, pdf, word, local to import back in to vn?, reminders/notes ios checklist?)
// todo: utilize shared storage? google drive? should we remove our own db dependency entirely!? then there would be very little overhead
// todo: notes have ability to add canvas mark?
// todo: realtime websockets data layer? users in the same project can unify their data, control video in realtime with each other? open video call? see canvas drawings or atleast each others cursor?
// todo: project last updated in the listing

// todo: mobile can still be used and when not sure of a note then select and it plays the video at the position required. (workflow of flicking between)
// todo: demo video = the videonote workflow... (explain the ease of note taking whilst video is running by having a playback offset, otherwise the simplicity of toggle and note flow)

// todo: can we use localStorage to save screenshots of video timestamp positions? use this in export feature

// todo: browser cross compatability of video files...

export default function Main({ serverData }) {
  return (
    <GlobalProvider serverData={serverData}>
      <VideoProvider>
        <TodoProvider>
          <Layout>
            <div className='flex flex-col w-full h-screen overflow-hidden'>
              {/* <div className='text-3xl'>header</div> */}

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
