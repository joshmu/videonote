/**
 * @path /pages/index.tsx
 *
 * @project videonote
 * @file index.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Sunday, 22nd November 2020 4:09:07 pm
 * @copyright © 2020 - 2020 MU
 */

import { StatusCodes } from 'http-status-codes'
import { NextPage, NextPageContext } from 'next'
import absoluteUrl from 'next-absolute-url'
import Cookies from 'universal-cookie'

import { Layout } from '@/components/Layout/Layout'
import { Modals } from '@/components/Modals/Modals'
import Notification from '@/components/Notification/Notification'
import { Sidebar } from '@/components/Sidebar/Sidebar'
import { VideoPlayer } from '@/components/VideoPlayer/VideoPlayer'
import { ControlsProvider } from '@/context/controlsContext'
import { GlobalProvider } from '@/context/globalContext'
import { NoteProvider } from '@/context/noteContext'
import { VideoProvider } from '@/context/videoContext'
import { AppContainer } from '@/layout/AppContainer/AppContainer'
import { Overlay } from '@/shared/Modal/Overlay'
import { fetcher } from '@/utils/clientHelpers'

// todo: highlight current project in projects modal list
// todo: total notes for current project on initial load is not showing on projects modal list totals?

// todo: realtime passing of notes, multi user, data flow back to current project rather than projects listing?

// todo: options dropdown allow to scroll down list with keypress
// todo: options dropdown to position against side of viewport so it is visible via shortcut in full screen mode

// todo: video file extension warnings... mkv (no audio)

// todo: double check alert for local video when it begins to fail

// todo: if date-fns doesn't serve us for the timer duration then just make our own

// todo: unify text with text components

// todo: insert an accept cookies msg? or should we avoid cookies so we don't need this?

// todo: offer restrictation on sharing to avoid other users adding their own notes (editable) (DB)
// todo: offer public url however password protected (DB)
// todo: more user friendly sharing? project title instead? (and when clash then add random suffix?) or half id? unique project title specifically for sharing?

// todo: create docker instance for demo purposes?

// todo: edit timestamp

// todo: mute option

// todo: option to change password
// todo: forget password option?

// todo: speech to text synthesis on actionInput
// todo: think about mobile variant

// todo: handle an audio file instead of a video file?
// todo: naming scheme which can cover using audio?

// todo: undo action for deleted projects and notes?
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

// todo: after registration the intro blank page could use more UI
// todo: error on emtpy create (shown in toast) - maybe show error in the dialog/modal form
// todo: teams, sharing notes with team
// todo: WCAG - install axe for chrome
// todo: logging of errors?
// todo: use enums for message status success etc
// todo: refresh token > use prompt to user > did you want to extend the session? use an interval timer for this

// todo: page route resets notifications

// todo: mobile can still be used and when not sure of a note then select and it plays the video at the position required. (workflow of flicking between)
// todo: demo video = the videonote workflow... (explain the ease of note taking whilst video is running by having a playback offset, otherwise the simplicity of toggle and note flow)

// todo: can we use localStorage to save screenshots of video timestamp positions? use this in export feature

// todo: browser cross compatability of video files...

// todo: welcome email when joining videonote

interface Props {
  serverData?: {}
}

const IndexPage: NextPage<Props> = ({ serverData = {} }) => {
  return (
    <GlobalProvider serverData={serverData}>
      <VideoProvider>
        <NoteProvider>
          <ControlsProvider>
            <Layout>
              <AppContainer>
                <VideoPlayer />
                <Sidebar />
              </AppContainer>

              <Overlay />
              <Modals />
              <Notification />
            </Layout>
          </ControlsProvider>
        </NoteProvider>
      </VideoProvider>
    </GlobalProvider>
  )
}

IndexPage.getInitialProps = async (ctx: NextPageContext) => {
  const cookies = new Cookies(
    ctx?.req?.headers?.cookie ? ctx.req.headers.cookie : null
  )
  const token = cookies.get('token')

  if (!token) {
    console.log('no token, redirecting...')
    // server
    ctx.res.writeHead(StatusCodes.MOVED_TEMPORARILY, {
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
  if (res.status !== StatusCodes.OK) {
    ctx.res.writeHead(StatusCodes.MOVED_TEMPORARILY, {
      Location: `/login`,
    })
    ctx.res.end()
    return
  }

  return { serverData: data }
}

export default IndexPage
