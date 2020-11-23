/**
 * @path /src/context/controlsContext.tsx
 *
 * @project videonote
 * @file controlsContext.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 20th October 2020
 * @modified Monday, 23rd November 2020 4:05:18 pm
 * @copyright © 2020 - 2020 MU
 */

import { createContext, useContext, useState } from 'react'

import { useGlobalKeydown } from '@/hooks/useGlobalKeydown'

import { useGlobalContext } from './globalContext'
import { useNoteContext } from './noteContext'
import { useVideoContext } from './videoContext'

type ControlsType = (key: string, keypressed: string[]) => void
type ToggleSmartControlsType = (a?: boolean) => void
interface ControlsContextInterface {
  smartControls: ControlsType
  isSmartControlsEnabled: boolean
  toggleSmartControls: ToggleSmartControlsType
}
export enum Keymap {
  SPACE = ' ',
  LEFT = 'ArrowLeft',
  RIGHT = 'ArrowRight',
  UP = 'ArrowUp',
  DOWN = 'ArrowDown',
  CMD = 'Meta',
  SHIFT = 'Shift',
  ALT = 'Alt',
  ESC = 'Escape',
}

const controlsContext = createContext<ControlsContextInterface>(null!)

export function ControlsProvider(props: { [key: string]: any }) {
  const { toggleSidebar, toggleMenuOpen, cancelModals } = useGlobalContext()
  const {
    togglePlay,
    jumpBack,
    jumpForward,
    changeVolume,
    seekTo,
  } = useVideoContext()
  const { notes, currentNote } = useNoteContext()

  const [isSmartControlsEnabled, setIsSmartControlsEnabled] = useState<boolean>(
    true
  )

  const globalControls: ControlsType = (key, _keysPressed) => {
    switch (key) {
      case Keymap.ESC:
        cancelModals()
        break
      default:
    }
  }

  const smartControls: ControlsType = (key, keysPressed) => {
    if (!isSmartControlsEnabled) return

    switch (key) {
      case Keymap.SPACE:
        keysPressed.includes(Keymap.SHIFT) ? toggleSidebar() : togglePlay()
        break
      case Keymap.LEFT:
        keysPressed.includes(Keymap.SHIFT) ? nextPrevNote('prev') : jumpBack()
        break
      case Keymap.RIGHT:
        keysPressed.includes(Keymap.SHIFT)
          ? nextPrevNote('next')
          : jumpForward()
        break
      case Keymap.UP:
        changeVolume(0.1)
        break
      case Keymap.DOWN:
        changeVolume(-0.1)
        break
      case Keymap.ALT:
        toggleMenuOpen()
        break
      case Keymap.ESC:
        cancelModals()
        break
      default:
      // console.log('unused key', { key })
    }
  }

  // add listeners
  useGlobalKeydown(globalControls)
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

  const nextPrevNote = (direction: 'next' | 'prev' = 'next'): void => {
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

    // get the destination note via the index
    const destinationNote = sortedNotes[idx]

    // go
    seekTo(destinationNote.time, { offset: false })
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
