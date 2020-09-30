import { useEffect, useState } from 'react'

export const useAnounceAction = (initialState = '') => {
  const [action, setAction] = useState('')
  // we want to capture action events and reset so we can receive multiple of the same events elsewhere
  // so we quickly reset to base state
  useEffect(() => {
    setTimeout(() => {
      setAction(initialState)
    }, 10)
  }, [action])

  return [action, setAction]
}
