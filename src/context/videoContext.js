import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useGlobalContext } from './globalContext'
import { useNotificationContext } from './notificationContext'
import { useAnounceAction } from '../hooks/useAnounceAction'

const videoContext = createContext({
  ready: false,
  playing: false,
  volume: 0.75,
  progress: { playedSeconds: 0, played: 0, loadedSeconds: 0, loaded: 0 },
  handleReady: a => {},
  url: '',
  togglePlay: (a = 0) => {},
  changeVolume: a => {},
  handleProgress: () => {},
  seekTo: a => {},
  playerRef: {},
  smartControls: a => {},
  handlePlayerError: a => {},
})

export function VideoProvider(props) {
  const { project, settings, toggleSidebar } = useGlobalContext()
  const { addAlert } = useNotificationContext()
  const playerRef = useRef(null)
  const [url, setUrl] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.75)
  const [progress, setProgress] = useState({})

  const [action, setAction] = useAnounceAction('')

  useEffect(() => {
    if (project) {
      if (project.src) setUrl(project.src)
    }
  }, [project])

  const handleReady = reactPlayer => {
    // assign react player
    playerRef.current = reactPlayer
  }

  const togglePlay = () => {
    setPlaying(!playing)

    setAction(!playing ? 'play' : 'pause')
  }

  const changeVolume = increment => {
    // validate
    if (Number(increment) === NaN) return

    // increment
    let newVolume = volume + Number(increment)
    // limit between 0 - 1
    newVolume = newVolume < 0 ? 0 : newVolume > 1 ? 1 : newVolume
    setVolume(newVolume)

    setAction(increment > 0 ? 'volumeUp' : 'volumeDown')
  }

  const handleProgress = e => {
    // * config progress interval via -> progressInterval prop
    // {playedSeconds: 8.362433858856201, played: 0.03743574367943649, loadedSeconds: 38.721, loaded: 0.17334061536119902}
    setProgress(e)
  }

  const seekTo = secs => {
    // validate
    if (Number(secs) === NaN) return

    // settings offset
    const playPosition = secs + settings.playOffset

    playerRef.current.seekTo(playPosition, 'seconds')
  }

  const jumpBack = () => {
    const destination = progress.playedSeconds - settings.seekJump
    seekTo(destination > 0 ? destination : 0)

    setAction('seekBack')
  }

  const jumpForward = () => {
    const destination = progress.playedSeconds + settings.seekJump
    seekTo(destination)

    setAction('seekForward')
  }

  const smartControls = key => {
    if (key === ' ') {
      togglePlay()
    }

    if (key === 'ArrowLeft') {
      jumpBack()
    }

    if (key === 'ArrowRight') {
      jumpForward()
    }

    if (key === 'ArrowUp') {
      changeVolume(0.1)
    }

    if (key === 'ArrowDown') {
      changeVolume(-0.1)
    }

    if (key === 'Shift') {
      toggleSidebar()
    }
  }

  const handlePlayerError = error => {
    console.log('vn player error', error)

    if (error.target && error.target.error.message.includes('Format error')) {
      // todo: show locate video file button
      return addAlert({
        type: 'warning',
        msg: 'Please re-select your local video',
      })
    }

    addAlert({ type: 'error', msg: 'Video Player: ' + error.message })
  }

  const value = {
    handleReady,
    url,
    playing,
    togglePlay,
    volume,
    changeVolume,
    handleProgress,
    progress,
    seekTo,
    playerRef,
    smartControls,
    handlePlayerError,
    action,
  }

  return <videoContext.Provider value={value} {...props} />
}

export function useVideoContext() {
  return useContext(videoContext)
}
