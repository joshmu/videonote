/**
 * @path /src/hooks/useAnounceAction.tsx
 *
 * @project videonote
 * @file useAnounceAction.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Wednesday, 30th September 2020
 * @modified Sunday, 22nd November 2020 2:57:02 pm
 * @copyright © 2020 - 2020 MU
 */

import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { PlayerAction } from '../context/videoContext'

type UseAnounceActionType = [
  PlayerAction | '',
  Dispatch<SetStateAction<PlayerAction | ''>>
]

export const useAnounceAction = (
  initialState: PlayerAction | '' = ''
): UseAnounceActionType => {
  const [action, setAction] = useState<PlayerAction | ''>('')
  // we want to capture action events and reset so we can receive multiple of the same events elsewhere
  // so we quickly reset to base state
  useEffect(() => {
    setTimeout(() => {
      setAction(initialState)
    }, 10)
  }, [action])

  return [action, setAction]
}
