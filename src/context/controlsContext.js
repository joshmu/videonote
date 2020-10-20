import { createContext, useContext, useState } from 'react'

import useGlobalKeydown from '../hooks/useGlobalKeydown'
import { useGlobalContext } from './globalContext'
import { useTodoContext } from './todoContext'
import { useVideoContext } from './videoContext'

const controlsContext = createContext({
  smartControls: a => {},
  isSmartControlsEnabled: true,
  toggleSmartControls: (a = undefined) => {},
})

export function ControlsProvider(props) {
  const { toggleSidebar, toggleMenuOpen, settings } = useGlobalContext()
  const {
    togglePlay,
    jumpBack,
    jumpForward,
    changeVolume,
    progress,
    seekTo,
  } = useVideoContext()
  const { todos } = useTodoContext()

  const [isSmartControlsEnabled, setIsSmartControlsEnabled] = useState(true)

  const smartControls = (key, keysPressed) => {
    if (!isSmartControlsEnabled) return

    if (key === ' ') {
      if (keysPressed.includes('Shift')) {
        toggleSidebar()
      } else {
        togglePlay()
      }
    }

    if (key === 'ArrowLeft') {
      if (keysPressed.includes('Shift')) {
        console.log('todo: jump prev note')
        const note = seekNote('prev')
        console.log({ note })
        seekTo(note.time)
      } else {
        jumpBack()
      }
    }

    if (key === 'ArrowRight') {
      if (keysPressed.includes('Shift')) {
        console.log('todo: jump next note')
        const note = seekNote('next')
        console.log({ note })
        seekTo(note.time)
      } else {
        jumpForward()
      }
    }

    if (key === 'ArrowUp') {
      changeVolume(0.1)
    }

    if (key === 'ArrowDown') {
      changeVolume(-0.1)
    }

    // CMD + SHIFT
    if (keysPressed.includes('Meta')) {
      if (key === 'Shift') {
        toggleSidebar()
      }
    }

    if (key === 'Alt') {
      toggleMenuOpen()
    }
  }

  useGlobalKeydown(smartControls)

  const toggleSmartControls = isEnabled => {
    // don't do anything if already enabled
    if (isEnabled === isSmartControlsEnabled) return

    setIsSmartControlsEnabled(current => {
      // if isEnable undefined then toggle
      const updatedState = isEnabled === undefined ? !current : isEnabled
      // console.log('smart controls enabled:', updatedState)
      return updatedState
    })
  }

  // todo: seekNote stil not right
  const seekNote = (direction = 'next') => {
    if (todos.length === 0) return
    if (todos.length === 1) return todos[0]
    const notes = todos.sort((a, b) => a.time - b.time)
    console.log({ notes, progress })

    let nextNote = notes.find(
      note => note.time + settings.playOffset > progress.playedSeconds
    )
    console.log({ nextNote, progress })
    if (!nextNote) nextNote = notes.slice(-1)[0]
    if (direction === 'prev') {
      const nextNoteIdx = notes.findIndex(note => note.id === nextNote.id)
      const prevNote = notes[nextNoteIdx === 0 ? nextNoteIdx : nextNoteIdx - 1]
      return prevNote
    } else {
      return nextNote
    }
  }

  const value = {
    smartControls,
    isSmartControlsEnabled,
    toggleSmartControls,
  }

  return <controlsContext.Provider value={value} {...props} />
}

export function useControlsContext() {
  return useContext(controlsContext)
}
