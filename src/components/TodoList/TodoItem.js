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
        done ? 'text-themeText2' : 'text-themeText'
      }  px-4 py-2 cursor-pointer hover:bg-blue-500 hover:text-white relative border-b`}
    >
      <div className='flex items-center justify-start w-full h-full text-base'>
        <div
          onClick={handleTimeClick}
          onContextMenu={handleTimeRightClick}
          className='pl-5 pr-3 text-sm'
        >
          <div className={`${done && 'line-through'}`}>
            <TimeDisplay seconds={time} />
          </div>
        </div>

        <div className='px-2 py-2'>
          {person && (
            <div className='font-medium leading-5 capitalize'>{person}</div>
          )}
          <div onClick={handleMsgClick} className='leading-5'>
            {msg}
          </div>
        </div>
      </div>
    </MotionFadeInOut>
  )
}
