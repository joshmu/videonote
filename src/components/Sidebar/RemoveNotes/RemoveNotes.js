import React from 'react'
import { ImBin2 as TrashIcon } from 'react-icons/im'

import { useTodoContext } from '@/context/todoContext'

const RemoveNotes = () => {
  const { removeCompleted } = useTodoContext()

  const handleRemoveCompleted = () => {
    removeCompleted()
  }

  return (
    <div
      onClick={handleRemoveCompleted}
      className='absolute bottom-0 right-0 p-4 duration-300 ease-in-out cursor-pointer text-themeText2 hover:text-themeAccent transtion-colors'
    >
      <TrashIcon className='fill-current' />
    </div>
  )
}

export default RemoveNotes
