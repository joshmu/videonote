/**
 * @path /src/components/NoteList/NoteItem/NoteItem.tsx
 *
 * @project videonote
 * @file NoteItem.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 14th September 2020
 * @modified Wednesday, 25th November 2020 11:47:43 am
 * @copyright © 2020 - 2020 MU
 */

import { Variants, motion } from 'framer-motion'
import { ChangeEvent, KeyboardEvent, useEffect, useState } from 'react'

import { useControlsContext } from '@/context/controlsContext'
import { useGlobalContext } from '@/context/globalContext'
import { useNoteContext } from '@/context/noteContext'
import { useVideoContext } from '@/context/videoContext'
import { useIsMount } from '@/hooks/useIsMount'
import { Select } from '@/shared/Select/Select'
import TimeDisplay from '@/shared/TimeDisplay/TimeDisplay'
import { NoteInterface, ShareProjectInterface } from '@/shared/types'

import DisplayUser from './DisplayUser/DisplayUser'

interface NoteItemInterface {
  note: NoteInterface
  closestProximity: boolean
  childVariants: Variants
}

export const NoteItem = ({
  note,
  closestProximity,
  childVariants,
}: NoteItemInterface) => {
  const { project, admin, user } = useGlobalContext()
  const { seekTo } = useVideoContext()
  const { toggleSmartControls } = useControlsContext()
  const { updateNote } = useNoteContext()

  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [state, setState] = useState<NoteInterface>(note)

  const isMount = useIsMount()

  // no smart controls whilst editing
  useEffect(() => {
    const enableSmartControls = !isEditing
    toggleSmartControls(enableSmartControls)
  }, [isEditing])

  // update note whenever their is a change
  useEffect(() => {
    // do not update on initial load
    if (isMount) return
    // do not update whilst editing content
    if (isEditing) return
    // do not update if state has not been modified from the initially loaded note
    if (Object.entries(state).every(([key, val]) => note[key] === val)) return

    updateNote(state)
  }, [isEditing, state, isMount])

  const handleTimeClick = (): void => {
    const updatedNote = { ...state, done: !state.done }
    setState(updatedNote)
  }

  const handleNoteClick = (): void => {
    seekTo(state.time)
  }
  const toggleEdit = (willEdit: boolean = undefined): void => {
    setIsEditing(current => {
      const newState = willEdit === undefined ? !current : willEdit
      return newState
    })
  }
  const handleEdit = (event: ChangeEvent<HTMLInputElement>): void => {
    const updatedState = {
      ...state,
      content: event.target.value,
    }
    setState(updatedState)
  }
  const handleEditKeys = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      setIsEditing(false)
      return
    }
  }

  const handleDoubleClick = (): void => {
    if (!admin && !(project?.share as ShareProjectInterface).canEdit) return
    toggleEdit(true)
  }

  return (
    <motion.div
      key={state._id}
      // * childVariants used so we don't pass 'initial', 'animate' etc
      variants={childVariants}
      className={`${
        closestProximity ? 'bg-opacity-25' : 'bg-opacity-0'
      } relative border-b cursor-pointer border-themeText2 bg-themeSelectOpacity transition-colors duration-200 ease-out`}
    >
      <Select padding='p-0'>
        <div className='relative flex items-center justify-start w-full h-full text-base'>
          <div
            onClick={handleTimeClick}
            className={`${
              state.done && 'line-through'
            } text-xs transition-colors duration-300 ease-in-out text-themeText2`}
          >
            <div className='px-2'>
              <TimeDisplay seconds={state.time} lock={closestProximity} />
            </div>
          </div>

          <div
            onClick={handleNoteClick}
            className={`${
              state.done && !closestProximity && 'text-themeText2'
            } w-full h-full py-2 pl-2`}
          >
            <DisplayUser
              noteUser={note.user}
              currentUser={user}
              currentSession={note?.currentSession}
            />
            {isEditing ? (
              <input
                type='text'
                value={state.content}
                onChange={handleEdit}
                onKeyDown={handleEditKeys}
                onDoubleClick={() => toggleEdit(false)}
                onBlur={() => toggleEdit(false)}
                className='placeholder-themeText text-themeText bg-themeBg focus:outline-none '
                autoFocus
              />
            ) : (
              <div
                onDoubleClick={handleDoubleClick}
                className='text-sm leading-5'
              >
                {state.content}
              </div>
            )}
          </div>
        </div>
      </Select>
    </motion.div>
  )
}
