import { useEffect, useRef, useState } from 'react'

import { useControlsContext } from '@/context/controlsContext'
import { useGlobalContext } from '@/context/globalContext'
import { useNoteContext } from '@/context/noteContext'
import { useVideoContext } from '@/context/videoContext'

import TimeDisplay from '../shared/TimeDisplay/TimeDisplay'
import ActionSymbols from './ActionSymbols/ActionSymbols'
import ProgressBar from './ProgressBar/ProgressBar'
import TimeMarkers from './TimeMarkers/TimeMarkers'

const PLACEHOLDER = 'Add Note...'

const ActionInput = () => {
  const inputRef = useRef(null)
  const { settings, sidebarOpen, HINTS, checkCanEdit } = useGlobalContext()
  const { progress } = useVideoContext()
  const { toggleSmartControls } = useControlsContext()
  const { addNote } = useNoteContext()

  const [note, setNote] = useState({
    content: '',
    time: null,
  })
  const [isActive, setIsActive] = useState(false)
  const [hint, setHint] = useState(getHint(HINTS, settings.showHints))

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
      autoFocus()
    }
  }, [sidebarOpen])

  const autoFocus = () => {
    if (!checkCanEdit) return
    console.log('autoFocus')
    inputRef.current.focus()
  }

  // * add new note on submit
  const handleSubmit = () => {
    addNote(note)
    // reset note state
    setNote({ content: '', time: null })

    // remove hints after adding note and while still in focus
    setHint(getHint(HINTS, false))
  }

  // * update note on entry but exclude initial char if it is a space for play/pause logic
  const handleChange = e => {
    // if we use an initial space then reset
    setNote({ ...note, content: e.target.value === ' ' ? '' : e.target.value })
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

  const handleFocus = e => {
    if (!isActive) setIsActive(true)
  }
  const handleBlur = e => {
    if (isActive) setIsActive(false)
  }

  const handleKeyDown = e => {
    if (note.content.length > 0) {
      if (e.key === 'Enter') handleSubmit()
    }

    // keyboard shortcuts on empty note
    if (note.content === '') {
      // smartControls(e.key)
    }
  }

  return (
    <div
      className={`${
        isActive ? 'bg-opacity-90' : 'bg-opacity-25'
      } relative flex items-center w-full h-full bg-themeBgOpacity`}
    >
      {checkCanEdit() && (
        <>
          <div className='flex items-center self-center justify-center h-full transition-all duration-150 ease-in-out bg-transparent rounded-r-none text-themeText2'>
            <TimeDisplay
              seconds={note.time ? note.time : progress.playedSeconds}
              lock={note.time !== null}
              active={isActive}
            />
          </div>

          <input
            ref={inputRef}
            className={`${
              isActive ? 'opacity-100' : 'opacity-50'
            } relative w-full h-full px-2 py-1 transition-all duration-150 ease-in-out bg-transparent rounded-sm rounded-b-none rounded-l-none placeholder-themeText2 text-themeText text-md focus:outline-none`}
            autoFocus={true}
            id='actionInput'
            name='addNote'
            type='text'
            placeholder={isActive ? hint : PLACEHOLDER}
            value={note.content}
            autoComplete='off'
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          <ActionSymbols />
        </>
      )}

      <TimeMarkers inputActive={isActive} />
      <div className='absolute bottom-0 left-0 w-full transform translate-y-full'>
        <ProgressBar active={isActive} />
      </div>
    </div>
  )
}

export default ActionInput

const getHint = (HINTS, show, prevHint = null) => {
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
