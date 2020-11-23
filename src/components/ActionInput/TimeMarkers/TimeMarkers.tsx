/**
 * @path /src/components/ActionInput/TimeMarkers/TimeMarkers.tsx
 *
 * @project videonote
 * @file TimeMarkers.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 19th October 2020
 * @modified Monday, 23rd November 2020 2:41:56 pm
 * @copyright © 2020 - 2020 MU
 */

import { useNoteContext } from '@/context/noteContext'
import { useVideoContext } from '@/context/videoContext'

export const TimeMarkers = ({
  actionInputIsActive,
}: {
  actionInputIsActive: boolean
}) => {
  const { notes } = useNoteContext()
  const { duration, progress, seekTo } = useVideoContext()

  const handleMarkPos = (time: number, duration: number): number => {
    const left = +((time / duration) * 100).toFixed(3)
    return left
  }

  return (
    duration !== null &&
    progress.loaded > 0 && (
      <div className='absolute top-0 w-full h-1 overflow-hidden'>
        {notes.map(note => (
          <div
            key={note._id}
            onClick={() => seekTo(note.time)}
            className='absolute z-30 w-1 h-1 transform -translate-x-1/2 rounded-full opacity-75 cursor-pointer bg-themeAccent2'
            style={{
              // bottom: '-0.25rem',
              // opacity: inputActive ? 0.75 : 0.25,
              bottom: '0',
              // width: '0.125rem',
              left: handleMarkPos(note.time, duration) + '%',
            }}
          ></div>
        ))}
      </div>
    )
  )
}
