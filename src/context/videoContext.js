import { createContext, useContext, useState, useRef } from 'react'

const videoContext = createContext({
  ready: false,
  playing: false,
  volume: 0.5,
  progress: { playedSeconds: 0, played: 0, loadedSeconds: 0, loaded: 0 },
})

export function VideoProvider(props) {
  const playerRef = useRef(null)
  const [url, setUrl] = useState('https://www.youtube.com/watch?v=gdZLi9oWNZg')
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [progress, setProgress] = useState({})

  const handleReady = reactPlayer => {
    // assign react player
    playerRef.current = reactPlayer
  }

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

    playerRef.current.seekTo(secs, 'seconds')
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
  }

  return <videoContext.Provider value={value} {...props} />
}

export function useVideoContext() {
  return useContext(videoContext)
}
