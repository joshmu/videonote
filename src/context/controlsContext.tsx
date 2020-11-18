import { createContext, useContext, useState } from 'react'

import { NoteInterface } from '@/shared/interfaces'

import useGlobalKeydown from '../hooks/useGlobalKeydown'
import { useGlobalContext } from './globalContext'
import { useNoteContext } from './noteContext'
import { useVideoContext } from './videoContext'

type SmartControlsType = (key: string, keypressed: string[]) => void
type ToggleSmartControlsType = (a?: boolean) => void
interface ControlsContextInterface {
  smartControls: SmartControlsType
  isSmartControlsEnabled: boolean
  toggleSmartControls: ToggleSmartControlsType
}

const controlsContext = createContext<ControlsContextInterface>(null!)

export function ControlsProvider(props: { [key: string]: any }) {
  const { toggleSidebar, toggleMenuOpen, settings } = useGlobalContext()
  const {
    togglePlay,
    jumpBack,
    jumpForward,
    changeVolume,
    seekTo,
  } = useVideoContext()
  const { notes, currentNote } = useNoteContext()

  const [isSmartControlsEnabled, setIsSmartControlsEnabled] = useState(true)

  const smartControls: SmartControlsType = (key, keysPressed) => {
    if (!isSmartControlsEnabled) return

    if (key === ' ') {
      if (keysPressed.includes('Shift')) {
        toggleSidebar()
      } else {
        console.log('play/pause')
        togglePlay()
      }
    }

    if (key === 'ArrowLeft') {
      if (keysPressed.includes('Shift')) {
        console.log('note: jump prev note')
        const note = nextPrevNote('prev')
        console.log({ note })
        seekTo(note.time, { offset: false })
      } else {
        jumpBack()
      }
    }

    if (key === 'ArrowRight') {
      if (keysPressed.includes('Shift')) {
        console.log('note: jump next note')
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

  const toggleSmartControls: ToggleSmartControlsType = isEnabled => {
    // don't do anything if already enabled
    if (isEnabled === isSmartControlsEnabled) return

    setIsSmartControlsEnabled(current => {
      // if isEnable undefined then toggle
      const updatedState = isEnabled === undefined ? !current : isEnabled
      // console.log('smart controls enabled:', updatedState)
      return updatedState
    })
  }

  // todo: ts enum?
  const nextPrevNote = (direction: 'next' | 'prev' = 'next'): NoteInterface => {
    // sort via time
    const sortedNotes = notes.sort((a, b) => a.time - b.time)
    const currentIndex = sortedNotes.findIndex(
      note => note._id === currentNote._id
    )
    // based on direction grab next/prev note or stop at the limit
    const idx =
      direction === 'next'
        ? currentIndex === sortedNotes.length - 1
          ? currentIndex
          : currentIndex + 1
        : currentIndex === 0
        ? currentIndex
        : currentIndex - 1

    return sortedNotes[idx]
  }

  const value: ControlsContextInterface = {
    smartControls,
    isSmartControlsEnabled,
    toggleSmartControls,
  }

  return <controlsContext.Provider value={value} {...props} />
}

export const useControlsContext = (): ControlsContextInterface => {
  return useContext(controlsContext)
}
