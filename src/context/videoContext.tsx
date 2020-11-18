import { createContext, useContext, useEffect, useRef, useState } from 'react'

import { useIsMount } from '@/hooks/useIsMount'
import { ProgressInterface } from '@/shared/interfaces'

import { useAnounceAction } from '../hooks/useAnounceAction'
import { useGlobalContext } from './globalContext'
import { useNotificationContext } from './notificationContext'
import { ReactPlayerProps } from 'react-player'

type SeekToType = (secs: number, settings?: { offset?: boolean }) => void
interface VideoContextInterface {
  playing: boolean
  volume: number
  setVolume: (vol: number) => void
  playbackRate: number
  setPlaybackRate: (rate: number) => void
  duration: number | null
  handleDuration: (duration: number) => void
  progress: ProgressInterface
  handleReady: (reactPlayer: ReactPlayerProps) => void
  url: string
  togglePlay: () => void
  changeVolume: (increment: number) => void
  handleProgress: (progress: ProgressInterface) => void
  seekTo: SeekToType
  playerRef: ReactPlayerProps
  handlePlayerError: (error: any) => void
  jumpBack: () => void
  jumpForward: () => void
}

const videoContext = createContext<VideoContextInterface>(null!)

export const VideoProvider = (props: { [key: string]: any }) => {
  const {
    project,
    updateProject,
    settings,
    toggleSidebar,
    toggleModalOpen,
    admin,
    toggleMenuOpen,
  } = useGlobalContext()
  const { addAlert } = useNotificationContext()
  const playerRef = useRef<ReactPlayerProps>(null!)
  const [url, setUrl] = useState<string>(null!)
  const [playing, setPlaying] = useState<boolean>(false)
  const [volume, setVolume] = useState<number>(0.75)
  const [playbackRate, setPlaybackRate] = useState<number>(1)
  const [duration, setDuration] = useState<number>(null!)
  // todo: this type cast is incorrect and null conditionals need to be checked in useNoteProximity
  const [progress, setProgress] = useState<ProgressInterface>(
    {} as ProgressInterface
  )

  const [action, setAction] = useAnounceAction('')
  const isMount = useIsMount()

  // on initial load alert user if project is available however no src is specified
  // * this could be due to a local video src thus being reset to an empty string when cannot be found
  useEffect(() => {
    if (!isMount) return
    console.log({ project })
    if (project && project.src.length === 0 && admin) {
      addAlert({
        type: 'warning',
        msg: (
          <span>
            Please provide video source for project:{' '}
            <span className='text-themeAccent'>{project.title}</span>
          </span>
        ),
        duration: 12000,
      })

      toggleModalOpen('current')
    }
  }, [project, admin, isMount])

  useEffect(() => {
    if (project !== null && project.src !== null) {
      if (project.src !== url) {
        console.log('project changed, setting url')
        setUrl(project.src)
      }
    } else {
      setUrl(null)
    }
  }, [project])

  const handleReady = (reactPlayer: ReactPlayerProps): void => {
    // assign react player
    playerRef.current = reactPlayer
  }

  const togglePlay = (): void => {
    setPlaying(playing => {
      const updatedPlayState = !playing
      // console.log({ playing, newState })
      setAction(updatedPlayState ? 'play' : 'pause')
      return updatedPlayState
    })
  }

  const changeVolume = (increment: number): void => {
    // validate
    if (Number(increment) === NaN) return

    // increment
    let newVolume = volume + Number(increment)
    // limit between 0 - 1
    newVolume = newVolume < 0 ? 0 : newVolume > 1 ? 1 : newVolume
    setVolume(newVolume)

    setAction(increment > 0 ? 'volumeUp' : 'volumeDown')
  }

  const handleProgress = (progressObj: ProgressInterface): void => {
    // * config progress interval via -> progressInterval prop
    // {playedSeconds: 8.362433858856201, played: 0.03743574367943649, loadedSeconds: 38.721, loaded: 0.17334061536119902}
    setProgress(progressObj)
  }

  const seekTo: SeekToType = (secs, { offset = true } = {}): void => {
    // validate
    if (Number(secs) === NaN || playerRef === null) return

    // settings offset
    const playPosition = secs + (offset ? settings.playOffset : 0)

    playerRef.current.seekTo(playPosition, 'seconds')
  }

  const jumpBack = (): void => {
    const destination = progress.playedSeconds - settings.seekJump
    seekTo(destination > 0 ? destination : 0)

    setAction('seekBack')
  }

  const jumpForward = (): void => {
    const destination = progress.playedSeconds + settings.seekJump
    seekTo(destination)

    setAction('seekForward')
  }

  const handlePlayerError = (error: any): void => {
    console.log('vn player error', error)

    if (error.target && error.target.error.message.includes('Format error')) {
      addAlert({
        type: 'warning',
        msg: 'Please re-locate your video, via project settings.',
        duration: 12000,
      })

      updateProject({ src: '' })
      toggleModalOpen('current')
      // requestLocalVideo()

      return
    }

    addAlert({ type: 'error', msg: 'Player unable to load video.' })
  }

  // todo: remove automatic pop up and replace with a button alternative ( or better > auto pop up current project settings modal)
  const requestLocalVideo = (): void => {
    console.log('reqesting local video')
    var input = document.createElement('input')
    input.type = 'file'

    input.onchange = (event: Event) => {
      const file = (event.target as HTMLInputElement).files[0]
      const url = URL.createObjectURL(file)
      console.log(url)
      if (typeof url !== 'string' || url.length === 0) return

      // if we have a src url we will update the project information and reset the React Player URL
      const updatedProject = { ...project, src: url }
      updateProject(updatedProject)
      setUrl(url)
    }

    input.click()
  }

  const handleDuration = (secs: number): void => {
    setDuration(secs)
  }

  const value = {
    handleReady,
    url,
    playing,
    togglePlay,
    volume,
    setVolume,
    playbackRate,
    setPlaybackRate,
    duration,
    handleDuration,
    changeVolume,
    handleProgress,
    progress,
    seekTo,
    playerRef,
    handlePlayerError,
    action,
    jumpForward,
    jumpBack,
  }

  return <videoContext.Provider value={value} {...props} />
}

export function useVideoContext() {
  return useContext(videoContext)
}
