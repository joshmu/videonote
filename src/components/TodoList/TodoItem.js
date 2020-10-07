import { useState, useEffect } from 'react'
import { useVideoContext } from '../../context/videoContext'
import TimeDisplay from '../TimeDisplay/TimeDisplay'
import { useTodoContext } from '../../context/todoContext'
import MotionFadeInOut from '../shared/MotionFadeInOut'
import Select from '../shared/Select'

export default function TodoItem({ todo, close }) {
  const { id, msg, person: category = null, time, done = false } = todo
  const { seekTo, toggleSmartControls } = useVideoContext()
  const { updateTodo, removeTodo } = useTodoContext()
  const [edit, setEdit] = useState(false)

  // no smart controls whilst editing
  useEffect(() => {
    const cmd = !edit
    toggleSmartControls(cmd)
  }, [edit])

  const handleTimeClick = () => {
    const updatedTodo = { ...todo, done: !todo.done }
    updateTodo(updatedTodo)
  }
  const handleNoteClick = () => {
    seekTo(time)
  }
  const toggleEdit = (willEdit = undefined) => {
    setEdit(current => {
      const newState = willEdit === undefined ? !current : willEdit
      return newState
    })
  }
  const handleEdit = e => {
    const updatedTodo = { ...todo, msg: e.target.value }
    updateTodo(updatedTodo)
  }
  const handleEditKeys = e => {
    if (e.key === 'Enter') {
      setEdit(false)
      return
    }
  }

  return (
    <MotionFadeInOut
      motionKey={id}
      style={{
        backgroundColor: close ? 'rgba(0, 0, 255, 0.07)' : '',
      }}
      className='relative border-b cursor-pointer border-themeText2'
    >
      <Select padding='p-0'>
        <div className='relative flex items-center justify-start w-full h-full text-base'>
          <div
            onClick={handleTimeClick}
            className={`${
              done && 'line-through'
            } text-xs transition-colors duration-300 ease-in-out text-themeText2`}
          >
            <div className='px-2'>
              <TimeDisplay seconds={time} />
            </div>
          </div>

          <div
            onClick={handleNoteClick}
            className={`${done && 'text-themeText2'} w-full h-full py-2 pl-2`}
          >
            {category && (
              <div className='text-sm leading-5 capitalize'>{category}</div>
            )}
            {edit ? (
              <input
                type='text'
                value={msg}
                onChange={handleEdit}
                onKeyDown={handleEditKeys}
                onDoubleClick={() => toggleEdit(false)}
                onBlur={() => toggleEdit(false)}
                className='bg-themeBg focus:outline-none'
                autoFocus
              />
            ) : (
              <div
                onDoubleClick={() => toggleEdit(true)}
                className='text-sm leading-5'
              >
                {msg}
              </div>
            )}
          </div>
        </div>
      </Select>
    </MotionFadeInOut>
  )
}
