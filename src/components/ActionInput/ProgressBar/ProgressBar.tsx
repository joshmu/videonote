/**
 * @path /src/components/ActionInput/ProgressBar/ProgressBar.tsx
 *
 * @project videonote
 * @file ProgressBar.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 12th October 2020
 * @modified Monday, 23rd November 2020 2:55:19 pm
 * @copyright © 2020 - 2020 MU
 */

import { MouseEvent, useRef } from 'react'

import { useVideoContext } from '@/context/videoContext'

export const ProgressBar = ({ active }) => {
  const { progress, duration, seekTo } = useVideoContext()
  const progressRef = useRef<HTMLDivElement>(null!)

  const getCoords = (
    event: MouseEvent<HTMLDivElement>,
    ref: { current: HTMLDivElement }
  ) => {
    const rect = ref.current.getBoundingClientRect()
    // x position within the element.
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    return { x, y, width: rect.width }
  }

  const handleClick = (event: MouseEvent<HTMLDivElement>): void => {
    const { x, width } = getCoords(event, progressRef)
    // percentage of width from the left
    const percLeft = x / width
    // convert to time
    const secondsPosition = percLeft * duration
    seekTo(secondsPosition)
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
          style={{ width: convertNumToPercentage(progress.played) + '%' }}
          className='absolute z-20 h-full bg-green-400'
        ></div>
        <div
          style={{ width: convertNumToPercentage(progress.loaded) + '%' }}
          className='absolute z-10 h-full transition-all duration-300 ease-linear bg-themeAccent2'
        ></div>
      </div>
    </div>
  )
}

const convertNumToPercentage = (num: number): number => {
  return +(num * 100).toFixed(3)
}
