import { useGlobalContext } from '../../context/globalContext'
import { useVideoContext } from '../../context/videoContext'
import TimeDisplay from '../TimeDisplay/TimeDisplay'
import { motion } from 'framer-motion'

export default function ListItem({ todo }) {
  const { id, msg, person = null, time, done = false } = todo
  const { seekTo } = useVideoContext()
  const { updateTodo, removeTodo } = useGlobalContext()

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
    <motion.tr
      key={id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`${
        done && 'text-gray-400'
      } relative py-1 text-xs transition-all duration-200 ease-in-out transform scale-100 bg-white border-b cursor-pointer hover:bg-highlight-100`}
    >
      <td
        onClick={handleTimeClick}
        onContextMenu={handleTimeRightClick}
        className='pl-5 pr-3'
      >
        <div className={`${done && 'line-through'}`}>
          <TimeDisplay seconds={time} />
        </div>
      </td>

      <td className='px-2 py-2'>
        {person && (
          <div className='font-medium leading-5 capitalize'>{person}</div>
        )}
        <div onClick={handleMsgClick} className='leading-5'>
          {msg}
        </div>
      </td>
    </motion.tr>
  )
}
