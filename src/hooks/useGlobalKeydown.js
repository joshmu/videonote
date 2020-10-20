import { useEffect, useState } from 'react'

const useGlobalKeydown = handler => {
  const [keysPressed, setKeysPressed] = useState([])

  useEffect(() => {
    const handleKeys = event => {
      const updatedKeysPressed = [...keysPressed, event.key]
      setKeysPressed(updatedKeysPressed)
      handler(event.key, keysPressed)
    }
    const handleKeyup = event => {
      if (keysPressed.includes(event.key))
        setKeysPressed(current => current.filter(key => key !== event.key))
    }

    globalThis.window.addEventListener('keydown', handleKeys)
    globalThis.window.addEventListener('keyup', handleKeyup)

    return () => {
      globalThis.window.removeEventListener('keydown', handleKeys)
      globalThis.window.removeEventListener('keyup', handleKeyup)
    }
  }, [handler, keysPressed])
}

export default useGlobalKeydown
