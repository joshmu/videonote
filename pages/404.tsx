import { useEffect } from 'react'

// Redirect any 404 to the landing page
const Custom404 = () => {
  useEffect(() => {
    window.location.href = '/'
  }, [])

  return <></>
}

export default Custom404
