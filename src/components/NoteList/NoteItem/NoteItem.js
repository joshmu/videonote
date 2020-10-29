import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import Select from '@/components/shared/Select/Select'
import { useControlsContext } from '@/context/controlsContext'
import { useNoteContext } from '@/context/noteContext'
import { useVideoContext } from '@/context/videoContext'

import TimeDisplay from '../../shared/TimeDisplay/TimeDisplay'

const NoteItem = ({ note, closestProximity, childVariants }) => {
  const { id, content, person: category = null, time, done = false } = note
  const { seekTo } = useVideoContext()
  const { toggleSmartControls } = useControlsContext()
  const { updateNote } = useNoteContext()
  const [isEditing, setIsEditing] = useState(false)
  const [scopedContent, setScopedContent] = useState(content)

  // no smart controls whilst editing
  useEffect(() => {
    const enableSmartControls = !isEditing
    toggleSmartControls(enableSmartControls)
  }, [isEditing])

  // when we stop editing and we have a change then update note content
  useEffect(() => {
    if (!isEditing && scopedContent !== content) {
      updateNote({ ...note, content: scopedContent }).then(responseNote => {
        if (responseNote.content === content) {
          // error must have occurred as we did not receive an updated version
          // reset scopedContent
          setScopedContent(content)
        }
      })
    }
  }, [isEditing, scopedContent])

  const handleTimeClick = () => {
    const updatedNote = { ...note, done: !note.done }
    updateNote(updatedNote)
  }
  const handleNoteClick = () => {
    seekTo(time)
  }
  const toggleEdit = (willEdit = undefined) => {
    setIsEditing(current => {
      const newState = willEdit === undefined ? !current : willEdit
      return newState
    })
  }
  const handleEdit = e => {
    setScopedContent(e.target.value)
  }
  const handleEditKeys = e => {
    if (e.key === 'Enter') {
      setIsEditing(false)
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
            {isEditing ? (
              <input
                type='text'
                value={scopedContent}
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
                {scopedContent}
              </div>
            )}
          </div>
        </div>
      </Select>
    </motion.div>
  )
}

export default NoteItem
