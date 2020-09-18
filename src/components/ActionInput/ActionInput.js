import { useEffect, useState } from 'react'

const ActionInput = () => {
  const [todo, setTodo] = useState({
    msg: '',
    timestamp: null,
  })
  const [active, setActive] = useState(false)

  // todo object = {msg: '', timestamp: 2039482093, done: false}

  // * listen to input and append timestamp when it is populated

  // * add new todo on submit
  const handleSubmit = e => {
    e.preventDefault()
  }

  // * update todo on entry but exclude initial char if it is a space for play/pause logic
  const handleChange = e => {
    setTodo({ ...todo, msg: e.target.value === ' ' ? '' : e.target.value })

    /*
    updateNewTodo({
      // don't apply space when toggling play/pause on empty input
      msg: e.target.value === ' ' ? '' : e.target.value,
    })
    */
  }

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
        window.alert('play')
        // togglePlay()
      }

      // if (e.key === 'ArrowLeft') {
      //   const destination = progress.playedSeconds - 10
      //   if (destination > 0) {
      //     seekTo(destination)
      //   } else {
      //     start of clip
      //     seekTo(0)
      //   }
      // }

      // if (e.key === 'ArrowRight') {
      //   const destination = progress.playedSeconds + 10
      //   seekTo(destination)
      // }

      // if (e.key === 'ArrowUp') {
      //   // todo: volume?
      // }

      // if (e.key === 'ArrowDown') {
      //   // todo: volume?
      // }
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
          active ? 'bg-opacity-75' : 'bg-opacity-25'
        } flex items-center transition-all duration-150 ease-in-out self-center justify-center h-full px-2 text-gray-400 bg-white rounded-r-none`}
      >
        <span>TIME</span>
      </div>
      <input
        className={`${
          active ? 'bg-opacity-75' : 'bg-opacity-25'
        } relative w-full transition-all duration-150 ease-in-out h-full px-2 py-1 text-sm text-gray-700 placeholder-gray-400 bg-white rounded-sm rounded-l-none focus:outline-none`}
        autoFocus={true}
        id='addTodo'
        name='addTodo'
        type='text'
        placeholder='Add note...'
        value={todo.msg}
        autoComplete='off'
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </div>
  )
}

export default ActionInput
