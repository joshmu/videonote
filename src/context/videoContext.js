import { createContext, useContext, useState, useRef } from 'react'

const videoContext = createContext({
  ready: false,
  playing: false,
  volume: 0.5,
  progress: { playedSeconds: 0, played: 0, loadedSeconds: 0, loaded: 0 },
})

export function VideoProvider(props) {
  const videoRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [progress, setProgress] = useState({})

  const togglePlay = () => {
    setPlaying(!playing)
  }

  const changeVolume = increment => {
    // validate
    if (Number(increment) === NaN) return

    // increment
    let newVolume = volume + Number(increment)
    // limit between 0 - 1
    newVolume = newVolume < 0 ? 0 : newVolume > 1 ? 1 : newVolume
    setVolume(newVolume)
  }

  const handleProgress = e => {
    // * config progress interval via -> progressInterval prop
    // {playedSeconds: 8.362433858856201, played: 0.03743574367943649, loadedSeconds: 38.721, loaded: 0.17334061536119902}
    setProgress(e)
  }

  const seekTo = secs => {
    // validate
    if (Number(secs) === NaN) return

    videoRef.current.seekTo(secs, 'seconds')
  }

  const handleReady = e => {
    console.log('ready?', e)
    setReady(true)
  }

  const value = {
    videoRef,
    handleReady,
    ready,
    playing,
    togglePlay,
    volume,
    changeVolume,
    handleProgress,
    progress,
    seekTo,
  }

  return <videoContext.Provider value={value} {...props} />
}

export function useVideoContext() {
  return useContext(videoContext)
}
