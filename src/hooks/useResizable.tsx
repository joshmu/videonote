/**
 * @path /src/hooks/useResizable.tsx
 *
 * @project videonote
 * @file useResizable.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Thursday, 24th September 2020
 * @modified Monday, 23rd November 2020 4:43:36 pm
 * @copyright © 2020 - 2020 MU
 */

import { throttle } from 'lodash'
import { MouseEvent, useEffect, useState } from 'react'

export const useResizable = ({
  initialSize,
  defaultSize,
}: {
  initialSize: number
  defaultSize: number
}): {
  state: { size: number; resizing: boolean }
  handleStartResize: () => void
} => {
  const [state, setState] = useState<{ size: number; resizing: boolean }>({
    size: initialSize,
    resizing: false,
  })

  // on initial load, check whether the server responds with something which isn't the default, if so then change
  useEffect(() => {
    if (state.size === defaultSize && initialSize !== defaultSize)
      setState({ ...state, size: initialSize })
  }, [initialSize])

  // resizable sidebar
  const handleStartResize = (): void => {
    if (state.resizing) return

    setState({ ...state, resizing: true })

    // @ts-ignore
    document.addEventListener('mousemove', throttleHandleResize)
    // @ts-ignore
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

  const handleResizing = (event: MouseEvent<HTMLDivElement>): void => {
    setState({ size: window.innerWidth - event.clientX, resizing: true })
  }

  // throttle resize event to every 20ms
  const throttleHandleResize = throttle(handleResizing, 20)

  const handleResizeEnd = (event: MouseEvent<HTMLDivElement>): void => {
    const newWidth = window.innerWidth - event.clientX
    setState({ size: newWidth, resizing: false })

    // @ts-ignore
    document.removeEventListener('mousemove', throttleHandleResize)
    // @ts-ignore
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
