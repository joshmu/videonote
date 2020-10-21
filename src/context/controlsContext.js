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
  const { todos, currentNote } = useTodoContext()

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
        const note = nextPrevNote('prev')
        console.log({ note })
        seekTo(note.time, { offset: false })
      } else {
        jumpBack()
      }
    }

    if (key === 'ArrowRight') {
      if (keysPressed.includes('Shift')) {
        console.log('todo: jump next note')
        const note = nextPrevNote('next')
        console.log({ note })
        seekTo(note.time, { offset: false })
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

  const nextPrevNote = (direction = 'next') => {
    // sort via time
    const notes = todos.sort((a, b) => a.time - b.time)
    const currentIndex = notes.findIndex(note => note.id === currentNote.id)
    // based on direction grab next/prev note or stop at the limit
    const idx =
      direction === 'next'
        ? currentIndex === notes.length - 1
          ? currentIndex
          : currentIndex + 1
        : currentIndex === 0
        ? currentIndex
        : currentIndex - 1

    return notes[idx]
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
