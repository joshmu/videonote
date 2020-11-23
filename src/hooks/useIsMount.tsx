/**
 * @path /src/hooks/useIsMount.tsx
 *
 * @project videonote
 * @file useIsMount.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Friday, 30th October 2020
 * @modified Monday, 23rd November 2020 4:37:35 pm
 * @copyright © 2020 - 2020 MU
 */

import { useEffect, useRef } from 'react'

export const useIsMount = (): boolean => {
  const isMountRef = useRef<boolean>(true)

  useEffect(() => {
    isMountRef.current = false
  }, [])

  return isMountRef.current
}
