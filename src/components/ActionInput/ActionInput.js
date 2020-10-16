import { useEffect, useRef, useState } from 'react'

import { useGlobalContext } from '@/context/globalContext'
import { useTodoContext } from '@/context/todoContext'
import { useVideoContext } from '@/context/videoContext'

import TimeDisplay from '../shared/TimeDisplay/TimeDisplay'
import ActionSymbols from './ActionSymbols/ActionSymbols'
import ProgressBar from './ProgressBar/ProgressBar'

const PLACEHOLDER = 'Add Note...'

const ActionInput = () => {
  const inputRef = useRef(null)
  const { settings, sidebarOpen, HINTS } = useGlobalContext()
  const { progress, toggleSmartControls } = useVideoContext()
  const { addTodo } = useTodoContext()

  const [todo, setTodo] = useState({
    msg: '',
    time: null,
  })
  const [active, setActive] = useState(false)
  const [hint, setHint] = useState(getHint(HINTS, settings.showHints))

  useEffect(() => {
    // generate new random hint each time we are focused on the input
    if (active) setHint(getHint(HINTS, settings.showHints, hint))
  }, [active])

  // enable smart controls when message field is empty
  useEffect(() => {
    const enableSmartControls = todo.msg.length === 0
    toggleSmartControls(enableSmartControls)
  }, [todo.msg])

  // auto focus
  useEffect(() => {
    // focus on full screen
    if (!sidebarOpen) {
      autoFocus()
    }
  }, [sidebarOpen])

  const autoFocus = () => {
    console.log('autoFocus')
    inputRef.current.focus()
  }

  // * add new todo on submit
  const handleSubmit = () => {
    addTodo(todo)
    // reset todo state
    setTodo({ msg: '', time: null })

    // remove hints after adding note and while still in focus
    setHint(getHint(HINTS, false))
  }

  // * update todo on entry but exclude initial char if it is a space for play/pause logic
  const handleChange = e => {
    // if we use an initial space then reset
    setTodo({ ...todo, msg: e.target.value === ' ' ? '' : e.target.value })
  }

  // alter todo timestamp based on whether we have txt data or not
  useEffect(() => {
    // if we have data then add timestamp
    if (todo.msg.length > 0 && todo.time === null)
      setTodo({ ...todo, time: progress.playedSeconds })
    // if we delete data and have a timestamp then reset
    if (todo.msg.length === 0 && todo.time !== null)
      setTodo({ ...todo, time: null })
  }, [todo.msg, todo.time, progress.playedSeconds])

  const handleFocus = e => {
    if (!active) setActive(true)
  }
  const handleBlur = e => {
    if (active) setActive(false)
  }

  // * keypress logic: space = play/pause, left-right = seek, up-down = volume
  const handleKeyDown = e => {
    if (todo.msg.length > 0) {
      if (e.key === 'Enter') handleSubmit()
    }

    // keyboard shortcuts on empty todo
    if (todo.msg === '') {
      // smartControls(e.key)
    }
  }

  return (
    <div
      className={`${
        active ? 'bg-opacity-90' : 'bg-opacity-25'
      } relative flex items-center w-full h-full bg-white`}
    >
      <div className='flex items-center self-center justify-center h-full px-2 text-gray-400 transition-all duration-150 ease-in-out bg-transparent rounded-r-none '>
        <TimeDisplay
          seconds={todo.time ? todo.time : progress.playedSeconds}
          lock={!!todo.time}
        />
      </div>

      <input
        ref={inputRef}
        className='relative w-full h-full px-2 py-1 text-gray-700 placeholder-gray-400 transition-all duration-150 ease-in-out bg-transparent rounded-sm rounded-b-none rounded-l-none text-md focus:outline-none'
        autoFocus={true}
        id='actionInput'
        name='addTodo'
        type='text'
        placeholder={active ? hint : PLACEHOLDER}
        value={todo.msg}
        autoComplete='off'
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      <ActionSymbols />

      <div className='absolute bottom-0 left-0 w-full transform translate-y-full'>
        <ProgressBar active={active} />
      </div>
    </div>
  )
}

export default ActionInput

const getHint = (HINTS, show, prevHint = null) => {
  if (!show) return PLACEHOLDER

  if (prevHint === null) {
    const randomIndex = Math.floor(Math.random() * HINTS.length)
    return HINTS[randomIndex]
  }

  // otherwise iterate over hints
  const prevIndex = HINTS.findIndex(hint => hint === prevHint)
  const nextIndex = prevIndex === HINTS.length - 1 ? 0 : prevIndex + 1
  return HINTS[nextIndex]
}
