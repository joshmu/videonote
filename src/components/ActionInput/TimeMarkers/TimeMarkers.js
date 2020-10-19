import { useTodoContext } from '@/context/todoContext'
import { useVideoContext } from '@/context/videoContext'

const TimeMarkers = () => {
  const { todos } = useTodoContext()
  const { duration, progress } = useVideoContext()

  const handleMarkPos = (time, duration) => {
    const left = +((time / duration) * 100).toFixed(3)
    return left + '%'
  }

  return (
    <>
      {duration !== null &&
        progress.loaded > 0 &&
        todos.map(todo => (
          <div
            key={todo.id}
            className='absolute z-30 h-1 bg-themeAccent2'
            style={{
              // bottom: '-0.25rem',
              bottom: '0',
              width: '0.125rem',
              left: handleMarkPos(todo.time, duration),
            }}
          ></div>
        ))}
    </>
  )
}

export default TimeMarkers
