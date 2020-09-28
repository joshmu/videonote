import { useVideoContext } from '../../context/videoContext'
import TimeDisplay from '../TimeDisplay/TimeDisplay'
import { useTodoContext } from '../../context/todoContext'
import MotionFadeInOut from '../shared/MotionFadeInOut'
import Select from '../shared/Select'

export default function TodoItem({ todo, close }) {
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
      style={{
        backgroundColor: close ? 'rgba(0, 0, 255, 0.04)' : '',
      }}
      className={`${done ? 'text-themeText2 line-through' : 'text-themeText'} 
      cursor-pointer relative border-b border-themeText2`}
    >
      <Select padding='p-0'>
        <div className='flex items-center justify-start w-full h-full text-base'>
          <div
            onClick={handleTimeClick}
            onContextMenu={handleTimeRightClick}
            className='text-xs transition-colors duration-300 ease-in-out text-themeText2'
          >
            <div className='px-2'>
              <TimeDisplay seconds={time} />
            </div>
          </div>

          <div className='w-full h-full py-2 pl-2'>
            {person && (
              <div className='text-sm leading-5 capitalize'>{person}</div>
            )}
            <div onClick={handleMsgClick} className='text-sm leading-5'>
              {msg}
            </div>
          </div>
        </div>
      </Select>
    </MotionFadeInOut>
  )
}
