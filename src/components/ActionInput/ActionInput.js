import { useEffect, useState } from 'react'
import ProgressBar from '../shared/ProgressBar'
import { useVideoContext } from '../../context/videoContext'
import TimeDisplay from '../TimeDisplay/TimeDisplay'

const ActionInput = () => {
  const { togglePlay, changeVolume, seekTo, ready } = useVideoContext()
  const [todo, setTodo] = useState({
    msg: '',
    timestamp: null,
  })
  const [active, setActive] = useState(false)
  const { progress } = useVideoContext()

  // * add new todo on submit
  const handleSubmit = e => {
    e.preventDefault()
  }

  // * update todo on entry but exclude initial char if it is a space for play/pause logic
  const handleChange = e => {
    // if we use an initial space then reset
    setTodo({ ...todo, msg: e.target.value === ' ' ? '' : e.target.value })
  }

  // alter todo timestamp based on whether we have txt data or not
  useEffect(() => {
    // if we have data then add timestamp
    if (todo.msg.length > 0 && todo.timestamp === null)
      setTodo({ ...todo, timestamp: progress.playedSeconds })
    // if we delete data and have a timestamp then reset
    if (todo.msg.length === 0 && todo.timestamp !== null)
      setTodo({ ...todo, timestamp: null })
  }, [todo.msg, todo.timestamp, progress.playedSeconds])

  const handleFocus = e => {
    if (!active) setActive(true)
  }
  const handleBlur = e => {
    if (active) setActive(false)
  }

  // * keypress logic: space = play/pause, left-right = seek, up-down = volume
  const handleKeyDown = e => {
    // keyboard shortcuts on empty todo
    if (todo.msg === '') {
      console.log('key', e.key)
      if (e.key === ' ') {
        togglePlay()
      }

      if (e.key === 'ArrowLeft') {
        const destination = progress.playedSeconds - 10
        if (destination > 0) {
          seekTo(destination)
        } else {
          // start of clip
          seekTo(0)
        }
      }

      if (e.key === 'ArrowRight') {
        const destination = progress.playedSeconds + 10
        seekTo(destination)
      }

      if (e.key === 'ArrowUp') {
        changeVolume(0.1)
      }

      if (e.key === 'ArrowDown') {
        changeVolume(-0.1)
      }
    }
  }

  // input bar
  // timeline
  // timestamp = represents video timer and switch to todo.timestamp when there is input
  // autoFocus
  // placeholder = 'Add note...'
  // autocomplete off
  // onChange = todo content manipulation
  // onKeydown = video player logic

  return (
    <div className='relative flex items-center w-full h-full'>
      <div
        className={`${
          active ? 'bg-opacity-90' : 'bg-opacity-25'
        } flex items-center transition-all duration-150 ease-in-out self-center justify-center h-full px-2 text-gray-400 bg-white rounded-r-none`}
      >
        <TimeDisplay
          seconds={todo.timestamp ? todo.timestamp : progress.playedSeconds}
          lock={!!todo.timestamp}
        />
      </div>
      <input
        className={`${
          active ? 'bg-opacity-90' : 'bg-opacity-25'
        } relative w-full transition-all duration-150 ease-in-out h-full px-2 py-1 text-sm text-gray-700 placeholder-gray-400 bg-white rounded-sm rounded-b-none rounded-l-none focus:outline-none`}
        autoFocus={true}
        id='addTodo'
        name='addTodo'
        type='text'
        placeholder='Add Note...'
        value={todo.msg}
        autoComplete='off'
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      <div className='absolute bottom-0 left-0 w-full transform translate-y-full'>
        <ProgressBar active={active} />
      </div>
    </div>
  )
}

export default ActionInput
