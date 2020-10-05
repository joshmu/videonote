import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useGlobalContext } from './globalContext'
import { useNotificationContext } from './notificationContext'
import { useAnounceAction } from '../hooks/useAnounceAction'
import { useSmartControls } from '../hooks/useSmartControls'

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
  enableSmartControls: true,
  toggleSmartControls: (a = undefined) => {},
})

export function VideoProvider(props) {
  const {
    project,
    updateProjects,
    settings,
    toggleSidebar,
  } = useGlobalContext()
  const { addAlert } = useNotificationContext()
  const playerRef = useRef(null)
  const [url, setUrl] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.75)
  const [progress, setProgress] = useState({})
  const [enableSmartControls, setEnableSmartControls] = useState(true)

  const [action, setAction] = useAnounceAction('')

  useEffect(() => {
    if (project !== null && project.src !== null) {
      console.log('project changed setting url')
      if (project.src !== url) setUrl(project.src)
    }
  }, [project])

  const handleReady = reactPlayer => {
    // assign react player
    playerRef.current = reactPlayer
  }

  const togglePlay = () => {
    setPlaying(playing => {
      const updatedPlayState = !playing
      // console.log({ playing, newState })
      setAction(updatedPlayState ? 'play' : 'pause')
      return updatedPlayState
    })
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
    if (Number(secs) === NaN || playerRef === null) return

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
    if (!enableSmartControls) return

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

  useSmartControls(smartControls, [
    progress,
    enableSmartControls,
    settings,
    playerRef,
  ])

  const handlePlayerError = error => {
    console.log('vn player error', error)

    if (error.target && error.target.error.message.includes('Format error')) {
      addAlert({
        type: 'warning',
        msg: 'Please re-select your local video',
      })

      requestLocalVideo()

      return
    }

    addAlert({ type: 'error', msg: 'Video Player: ' + error.message })
  }

  const toggleSmartControls = cmd => {
    // don't do anything if no change is required
    if (cmd === enableSmartControls) return

    setEnableSmartControls(current => {
      const updatedState = cmd === undefined ? !current : cmd
      console.log('smart controls enabled:', updatedState)
      return updatedState
    })
  }

  // todo: remove automatic pop up and replace with a button alternative ( or better > auto pop up current project settings modal)
  const requestLocalVideo = () => {
    console.log('reqesting local video')
    var input = document.createElement('input')
    input.type = 'file'

    input.onchange = e => {
      const file = e.target.files[0]
      const url = URL.createObjectURL(file)
      console.log(url)
      if (typeof url !== 'string' || url.length === 0) return

      // if we have a src url we will update the project information and reset the React Player URL
      const updatedProject = { ...project, src: url }
      updateProjects(updatedProject)
      setUrl(url)
    }

    input.click()
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
    enableSmartControls,
    toggleSmartControls,
  }

  return <videoContext.Provider value={value} {...props} />
}

export function useVideoContext() {
  return useContext(videoContext)
}
