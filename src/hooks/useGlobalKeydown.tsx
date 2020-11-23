/**
 * @path /src/hooks/useGlobalKeydown.tsx
 *
 * @project videonote
 * @file useGlobalKeydown.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Wednesday, 30th September 2020
 * @modified Monday, 23rd November 2020 5:06:50 pm
 * @copyright © 2020 - 2020 MU
 */

import { KeyboardEvent, useEffect, useState } from 'react'

import { Keymap } from '@/context/controlsContext'

type HandlerType = (eventKey: Keymap, keysPressed: Keymap[]) => void

export const useGlobalKeydown = (handler: HandlerType): void => {
  const [keysPressed, setKeysPressed] = useState<Keymap[]>([])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      // do nothing if it is not part of our desired keymap
      if (!Object.values(Keymap).includes(event.key as Keymap)) return

      const key = event.key as Keymap

      const updatedKeysPressed = [...keysPressed, key]
      setKeysPressed(updatedKeysPressed)
      handler(key, keysPressed)
    }

    const handleKeyup = (event: KeyboardEvent): void => {
      // do nothing if it is not part of our desired keymap
      if (!Object.values(Keymap).includes(event.key as Keymap)) return

      const key = event.key as Keymap

      if (keysPressed.includes(key))
        setKeysPressed(current =>
          current.filter(pressedKey => key !== pressedKey)
        )
    }

    // @ts-ignore
    window.addEventListener('keydown', handleKeyDown)
    // @ts-ignore
    window.addEventListener('keyup', handleKeyup)

    return () => {
      // @ts-ignore
      window.removeEventListener('keydown', handleKeyDown)
      // @ts-ignore
      window.removeEventListener('keyup', handleKeyup)
    }
  }, [handler, keysPressed])
}
