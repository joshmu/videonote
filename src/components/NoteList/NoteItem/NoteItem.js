import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import Select from '@/components/shared/Select/Select'
import { useControlsContext } from '@/context/controlsContext'
import { useNoteContext } from '@/context/noteContext'
import { useVideoContext } from '@/context/videoContext'

import TimeDisplay from '../../shared/TimeDisplay/TimeDisplay'

export default function TodoItem({ todo, closestProximity, childVariants }) {
  const { id, content, person: category = null, time, done = false } = todo
  const { seekTo } = useVideoContext()
  const { toggleSmartControls } = useControlsContext()
  const { updateNote } = useNoteContext()
  const [edit, setEdit] = useState(false)

  // no smart controls whilst editing
  useEffect(() => {
    const enableSmartControls = !edit
    toggleSmartControls(enableSmartControls)
  }, [edit])

  const handleTimeClick = () => {
    const updatedTodo = { ...todo, done: !todo.done }
    updateNote(updatedTodo)
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
    const updatedTodo = { ...todo, content: e.target.value }
    updateNote(updatedTodo)
  }
  const handleEditKeys = e => {
    if (e.key === 'Enter') {
      setEdit(false)
      return
    }
  }

  return (
    <motion.div
      key={id}
      // * childVariants used so we don't pass 'initial', 'animate' etc
      variants={childVariants}
      className={`${
        closestProximity ? 'bg-opacity-25' : ' bg-opacity-0'
      } relative border-b cursor-pointer border-themeText2 bg-themeSelectOpacity transition-colors duration-200 ease-out`}
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
              <TimeDisplay seconds={time} lock={closestProximity} />
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
                value={content}
                onChange={handleEdit}
                onKeyDown={handleEditKeys}
                onDoubleClick={() => toggleEdit(false)}
                onBlur={() => toggleEdit(false)}
                className='placeholder-themeText text-themeText bg-themeBg focus:outline-none '
                autoFocus
              />
            ) : (
              <div
                onDoubleClick={() => toggleEdit(true)}
                className='text-sm leading-5'
              >
                {content}
              </div>
            )}
          </div>
        </div>
      </Select>
    </motion.div>
  )
}
