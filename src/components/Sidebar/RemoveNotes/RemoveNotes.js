import React from 'react'
import { ImBin2 as TrashIcon } from 'react-icons/im'

import { useGlobalContext } from '@/context/globalContext'
import { useTodoContext } from '@/context/todoContext'

const RemoveNotes = () => {
  const { confirmationPrompt, project } = useGlobalContext()
  const { removeCompleted, todos } = useTodoContext()

  const handleRemoveCompleted = () => {
    const todoCompletedCount = todos.filter(todo => todo.done).length
    confirmationPrompt({
      msg: (
        <span>
          Are you sure you want to remove your{' '}
          <span className='text-themeAccent'>{todoCompletedCount}</span>{' '}
          completed note{todoCompletedCount > 1 && 's'} for project:{' '}
          <span className='text-themeAccent'>{project.title}</span>?
        </span>
      ),
      action: () => {
        removeCompleted()
      },
    })
  }

  return (
    todos.filter(todo => todo.done).length > 0 && (
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
