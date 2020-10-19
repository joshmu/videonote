import { useEffect } from 'react'

const useGlobalKeydown = (smartControls, dependencyArray = []) => {
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

export default useGlobalKeydown
