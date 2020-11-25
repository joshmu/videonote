/**
 * @path /src/components/Sidebar/SidebarFooter/RemoveNotes/RemoveNotes.tsx
 *
 * @project videonote
 * @file RemoveNotes.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 12th October 2020
 * @modified Wednesday, 25th November 2020 9:14:15 pm
 * @copyright © 2020 - 2020 MU
 */

import { AnimatePresence, motion } from 'framer-motion'
import React, { useState } from 'react'
import { ImBin2 as TrashIcon } from 'react-icons/im'

import { useGlobalContext } from '@/context/globalContext'
import { useNoteContext } from '@/context/noteContext'

import { NoteInterface } from '../../../shared/types'

export const RemoveNotes = () => {
  const { createPrompt, project } = useGlobalContext()
  const { removeCompleted, notes } = useNoteContext()
  const [showLabel, setShowLabel] = useState<boolean>(false)

  const handleRemoveCompleted = () => {
    const noteCompletedCount = notes.filter(note => note.done).length
    createPrompt({
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

  const handleEnter = (): void => {
    setShowLabel(true)
  }
  const handleExit = (): void => {
    setShowLabel(false)
  }

  return (
    <AnimatePresence>
      {completedNotes(notes).length > 0 && (
        <div
          onClick={handleRemoveCompleted}
          onMouseEnter={handleEnter}
          onMouseLeave={handleExit}
          className='duration-200 ease-in-out cursor-pointer text-themeText2 hover:text-themeAccent transtion-colors'
        >
          <motion.div
            key='removeNotesIcon'
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className='flex items-center'
          >
            <AnimatePresence>
              {showLabel && (
                <motion.p
                  key='removeNotesLabel'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className='mr-2 text-sm'
                >
                  Remove {completedNotes(notes).length} Notes
                </motion.p>
              )}
            </AnimatePresence>
            <TrashIcon className='stroke-current' />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

const completedNotes = (notes: NoteInterface[]): NoteInterface[] =>
  notes.filter(note => note.done)
