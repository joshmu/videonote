import { useVideoContext } from '../../context/videoContext'
import TimeDisplay from '../TimeDisplay/TimeDisplay'
import { useTodoContext } from '../../context/todoContext'
import MotionFadeInOut from '../shared/MotionFadeInOut'

export default function TodoItem({ todo }) {
  const { id, msg, person = null, time, done = false } = todo
  const { seekTo } = useVideoContext()
  const { updateTodo, removeTodo } = useTodoContext()

  const handleTimeClick = () => {
    const updatedTodo = { ...todo, done: !todo.done }
    updateTodo(updatedTodo)
  }
  const handleTimeRightClick = e => {
    e.preventDefault()
    removeTodo(id)
  }
  const handleMsgClick = () => {
    seekTo(time)
  }

  return (
    <MotionFadeInOut
      motionKey={id}
      className={`${
        done ? 'text-themeText2 line-through' : 'text-themeText'
      }  px-4 py-2 cursor-pointer hover:bg-blue-500 transition-colors duration-300 ease-in-out hover:text-white relative border-b`}
    >
      <div className='flex items-center justify-start w-full h-full p-1 text-base'>
        <div
          onClick={handleTimeClick}
          onContextMenu={handleTimeRightClick}
          className='text-xs transition-colors duration-300 ease-in-out text-themeText2'
        >
          <div>
            <TimeDisplay seconds={time} />
          </div>
        </div>

        <div className='ml-4'>
          {person && (
            <div className='text-sm leading-5 capitalize'>{person}</div>
          )}
          <div onClick={handleMsgClick} className='text-sm leading-5'>
            {msg}
          </div>
        </div>
      </div>
    </MotionFadeInOut>
  )
}
