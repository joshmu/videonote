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

    window.addEventListener('keydown', handleKeys)
    window.addEventListener('keyup', handleKeyup)

    return () => {
      window.removeEventListener('keydown', handleKeys)
      window.removeEventListener('keyup', handleKeyup)
    }
  }, [handler, keysPressed])
}

export default useGlobalKeydown
