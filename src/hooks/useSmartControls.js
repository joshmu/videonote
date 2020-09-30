import { useEffect } from 'react'

export const useSmartControls = (smartControls, dependencyArray) => {
  useEffect(() => {
    const handleKeys = event => {
      smartControls(event.key)
    }
    globalThis.window.addEventListener('keydown', handleKeys)
    return () => {
      globalThis.window.removeEventListener('keydown', handleKeys)
    }
  }, dependencyArray)
}
