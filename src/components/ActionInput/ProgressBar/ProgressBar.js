import { useRef } from 'react'

import { useVideoContext } from '@/context/videoContext'

export default function progressBar({ active }) {
  const { progress, duration, seekTo } = useVideoContext()
  const progressRef = useRef(null)

  const perc = num => {
    return (num * 100).toFixed(3) + '%'
  }

  const handleClick = e => {
    const { x, width } = getCoords(e, progressRef)
    // percentage of width from the left
    const percLeft = x / width
    // convert to time
    const secondsPosition = percLeft * duration
    seekTo(secondsPosition)
  }

  const getCoords = (e, ref) => {
    const rect = ref.current.getBoundingClientRect()
    // x position within the element.
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    return { x, y, width: rect.width }
  }

  return (
    <div
      onClick={handleClick}
      ref={progressRef}
      className={`${
        active ? 'opacity-100' : 'opacity-90'
      } relative h-3 overflow-hidden text-xs bg-transparent cursor-pointer w-full flex items-center`}
    >
      <div className='relative w-full h-1 overflow-hidden'>
        <div
          style={{ width: perc(progress.played) }}
          className='absolute z-20 h-full bg-green-400'
        ></div>
        <div
          style={{ width: perc(progress.loaded) }}
          className='absolute z-10 h-full transition-all duration-300 ease-linear bg-themeAccent2'
        ></div>
      </div>
    </div>
  )
}
