import { useVideoContext } from '@/context/videoContext'

export default function progressBar({ active }) {
  const { progress, duration, seekTo } = useVideoContext()

  const perc = num => {
    return (num * 100).toFixed(3) + '%'
  }

  const calcCoord = e => {
    const rect = e.target.getBoundingClientRect()
    // x position within the element.
    const x = e.clientX - rect.left
    // percentage left
    const percLeft = x / rect.width
    // convert to time
    const secondsPosition = percLeft * duration
    // console.log({ x, percLeft, timestampPosition })
    seekTo(secondsPosition)
  }

  return (
    <div
      onClick={calcCoord}
      className={`${
        active ? 'opacity-100' : 'opacity-90'
      } relative h-1 overflow-hidden text-xs bg-transparent cursor-pointer`}
    >
      <div
        style={{ width: perc(progress.played) }}
        className='absolute z-20 h-full bg-green-400'
      ></div>
      <div
        style={{ width: perc(progress.loaded) }}
        className='absolute z-10 h-full transition-all duration-300 ease-linear bg-themeAccent2'
      ></div>
    </div>
  )
}
