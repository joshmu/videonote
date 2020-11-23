/**
 * @path /src/components/ActionInput/ActionInput.tsx
 *
 * @project videonote
 * @file ActionInput.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Thursday, 17th September 2020
 * @modified Monday, 23rd November 2020 2:44:52 pm
 * @copyright © 2020 - 2020 MU
 */

import { ChangeEvent, KeyboardEvent, useEffect, useState } from 'react'

import { useControlsContext } from '@/context/controlsContext'
import { useGlobalContext } from '@/context/globalContext'
import { useNoteContext } from '@/context/noteContext'
import { useVideoContext } from '@/context/videoContext'

import TimeDisplay from '../shared/TimeDisplay/TimeDisplay'
import { NoteInterface } from '../shared/types'
import ActionSymbols from './ActionSymbols/ActionSymbols'
import { ProgressBar } from './ProgressBar/ProgressBar'
import { TimeMarkers } from './TimeMarkers/TimeMarkers'

const PLACEHOLDER = 'Add Note...'

export const ActionInput = () => {
  const {
    settings,
    sidebarOpen,
    HINTS,
    checkCanEdit,
    actionInputRef,
    actionInputFocus,
  } = useGlobalContext()
  const { progress } = useVideoContext()
  const { toggleSmartControls } = useControlsContext()
  const { addNote } = useNoteContext()

  const [note, setNote] = useState<
    NoteInterface | { content: string; time: number }
  >({
    content: '',
    time: null,
  })
  const [isActive, setIsActive] = useState<boolean>(false)
  const [hint, setHint] = useState<string>(getHint(HINTS, settings.showHints))

  useEffect(() => {
    // generate new random hint each time we are focused on the input
    if (isActive) setHint(getHint(HINTS, settings.showHints, hint))
  }, [isActive])

  // enable smart controls when message field is empty
  useEffect(() => {
    const enableSmartControls = note.content.length === 0
    toggleSmartControls(enableSmartControls)
  }, [note.content])

  // auto focus
  useEffect(() => {
    // focus on full screen
    if (!sidebarOpen) {
      actionInputFocus()
    }
  }, [sidebarOpen])

  // * add new note on submit
  const handleSubmit = () => {
    addNote(note)
    // reset note state
    setNote({ content: '', time: null })

    // remove hints after adding note and while still in focus
    setHint(getHint(HINTS, false))
  }

  // * update note on entry but exclude initial char if it is a space for play/pause logic
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    // if we use an initial space then reset
    setNote({
      ...note,
      content: event.target.value === ' ' ? '' : event.target.value,
    })
  }

  // alter note timestamp based on whether we have txt data or not
  useEffect(() => {
    // if we have data then add timestamp
    if (note.content.length > 0 && note.time === null)
      setNote({ ...note, time: progress.playedSeconds })
    // if we delete data and have a timestamp then reset
    if (note.content.length === 0 && note.time !== null)
      setNote({ ...note, time: null })
  }, [note.content, note.time, progress.playedSeconds])

  const handleFocus = (): void => {
    if (!isActive) setIsActive(true)
  }
  const handleBlur = (): void => {
    if (isActive) setIsActive(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    // actions possible if text has been place within input
    if (note.content.length > 0) {
      if (event.key === 'Enter') handleSubmit()
    }
  }

  return (
    <div
      className={`${
        isActive ? 'bg-opacity-90' : 'bg-opacity-25'
      } relative flex items-center w-full h-full bg-themeBgOpacity`}
    >
      <div className='flex items-center self-center justify-center h-full transition-all duration-150 ease-in-out bg-transparent rounded-r-none text-themeText2'>
        <TimeDisplay
          seconds={note.time ? note.time : progress.playedSeconds}
          lock={note.time !== null}
          active={isActive}
        />
      </div>

      <input
        ref={actionInputRef}
        className={`${
          isActive ? 'opacity-100' : 'opacity-50'
        } relative w-full h-full px-2 py-1 transition-all duration-150 ease-in-out bg-transparent rounded-sm rounded-b-none rounded-l-none placeholder-themeText2 text-themeText text-md focus:outline-none`}
        autoFocus={true}
        id='actionInput'
        name='addNote'
        type='text'
        placeholder={
          isActive
            ? hint
            : checkCanEdit()
            ? PLACEHOLDER
            : 'Guest mode. Add/Edit notes disabled.'
        }
        value={note.content}
        autoComplete='off'
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      <ActionSymbols />

      <div className='absolute bottom-0 left-0 w-full transform translate-y-1/2'>
        <TimeMarkers actionInputIsActive={isActive} />
        <ProgressBar active={isActive} />
      </div>
    </div>
  )
}

const getHint = (
  HINTS: string[],
  show: boolean,
  prevHint: string = null
): string => {
  if (!show) return PLACEHOLDER

  if (prevHint === null) {
    const randomIndex = Math.floor(Math.random() * HINTS.length)
    return HINTS[randomIndex]
  }

  // otherwise iterate over hints
  const prevIndex = HINTS.findIndex(hint => hint === prevHint)
  const nextIndex = prevIndex === HINTS.length - 1 ? 0 : prevIndex + 1
  return HINTS[nextIndex]
}
