import { useNoteContext } from '@/context/noteContext'
import { useVideoContext } from '@/context/videoContext'

const TimeMarkers = ({ inputActive }) => {
  const { notes } = useNoteContext()
  const { duration, progress, seekTo } = useVideoContext()

  const handleMarkPos = (time, duration) => {
    const left = +((time / duration) * 100).toFixed(3)
    return left + '%'
  }

  return (
    duration !== null &&
    progress.loaded > 0 && (
      <div className='absolute bottom-0 w-full h-1 overflow-hidden'>
        {notes.map(note => (
          <div
            key={note.id}
            onClick={() => seekTo(note.time)}
            className='absolute z-30 h-1 transform -translate-x-1/2 cursor-pointer bg-themeAccent2'
            style={{
              // bottom: '-0.25rem',
              opacity: inputActive ? 0.75 : 0.25,
              bottom: '0',
              width: '0.125rem',
              left: handleMarkPos(note.time, duration),
            }}
          ></div>
        ))}
      </div>
    )
  )
}

export default TimeMarkers
