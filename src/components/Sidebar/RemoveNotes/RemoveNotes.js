import React from 'react'
import { ImBin2 as TrashIcon } from 'react-icons/im'

import { useGlobalContext } from '@/context/globalContext'
import { useNoteContext } from '@/context/noteContext'

const RemoveNotes = () => {
  const { prompt, project } = useGlobalContext()
  const { removeCompleted, notes } = useNoteContext()

  const handleRemoveCompleted = () => {
    const noteCompletedCount = notes.filter(note => note.done).length
    prompt({
      msg: (
        <span>
          Are you sure you want to remove your{' '}
          <span className='text-themeAccent'>{noteCompletedCount}</span>{' '}
          completed note{noteCompletedCount > 1 && 's'} for project:{' '}
          <span className='text-themeAccent'>{project.title}</span>?
        </span>
      ),
      action: () => {
        removeCompleted()
      },
    })
  }

  return (
    notes.filter(note => note.done).length > 0 && (
      <div
        onClick={handleRemoveCompleted}
        className='absolute bottom-0 right-0 p-4 duration-300 ease-in-out cursor-pointer text-themeText2 hover:text-themeAccent transtion-colors'
      >
        <TrashIcon className='fill-current' />
      </div>
    )
  )
}

export default RemoveNotes
