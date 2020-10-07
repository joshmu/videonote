import { useState, useEffect } from 'react'

export const useResizable = ({ initialSize, defaultSize }) => {
  const [state, setState] = useState({
    size: initialSize,
    resizing: false,
  })

  // on initial load, check whether the server responds with something which isn't the default, if so then change
  useEffect(() => {
    if (state.size === defaultSize && initialSize !== defaultSize)
      setState({ ...state, size: initialSize })
  }, [initialSize])

  // resizable sidebar
  const handleStartResize = () => {
    if (!state.resizing) {
      setState({ ...state, resizing: true })

      document.addEventListener('mousemove', handleResizing)
      document.addEventListener('mouseup', handleResizeEnd)
      // lock resize cursor
      document.body.style.cursor = 'ew-resize'
      // disable text selection
      document.body.classList.add('disable-select')
      // pointer events fix
      // document.getElementsByTagName('iframe')[0].style.pointerEvents = 'none'
      document.getElementById('videoContent').style.pointerEvents = 'none'
      // remove transition duration
      document.getElementById('videoContent').style.transitionDuration = '0'
      document.getElementById('sidebar').style.transitionDuration = '0'
    }
  }

  const handleResizing = e => {
    setState({ size: window.innerWidth - e.clientX, resizing: true })
  }

  const handleResizeEnd = e => {
    const newWidth = window.innerWidth - e.clientX
    setState({ size: newWidth, resizing: false })

    document.removeEventListener('mousemove', handleResizing)
    document.removeEventListener('mouseup', handleResizeEnd)
    // remove resize cursor
    document.body.style.cursor = 'default'
    // resume text selection
    document.body.classList.remove('disable-select')
    // pointer events fix
    // document.getElementsByTagName('iframe')[0].style.pointerEvents = 'auto'
    document.getElementById('videoContent').style.pointerEvents = 'auto'
    // resume transition duration
    document.getElementById('videoContent').style.transitionDuration = '300'
    document.getElementById('sidebar').style.transitionDuration = '500'
  }

  return { state, handleStartResize }
}
