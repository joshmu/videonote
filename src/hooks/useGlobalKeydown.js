import { useEffect } from 'react'

const useGlobalKeydown = handler => {
  useEffect(() => {
    const handleKeys = event => {
      handler(event.key)
    }
    globalThis.window.addEventListener('keydown', handleKeys)
    return () => {
      globalThis.window.removeEventListener('keydown', handleKeys)
    }
  }, [handler])
}

export default useGlobalKeydown
