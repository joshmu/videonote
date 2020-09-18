import { useEffect, useState } from 'react'

const ActionInput = () => {
  const [todo, setTodo] = useState({
    msg: '',
    timestamp: null,
  })

  // todo object = {msg: '', timestamp: 2039482093, done: false}

  // * listen to input and append timestamp when it is populated

  // * add new todo on submit
  const onSubmit = e => {
    e.preventDefault()
  }

  // * update todo on entry but exclude initial char if it is a space for play/pause logic
  const onChange = e => {
    setTodo({ ...todo, msg: e.target.value === ' ' ? '' : e.target.value })

    /*
    updateNewTodo({
      // don't apply space when toggling play/pause on empty input
      msg: e.target.value === ' ' ? '' : e.target.value,
    })
    */
  }

  // * keypress logic: space = play/pause, left-right = seek, up-down = volume
  const onKeyDown = e => {
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
      <div className='flex items-center self-center justify-center h-full px-2 text-gray-400 bg-white bg-opacity-75 rounded-r-none'>
        <span>TIME</span>
      </div>
      <input
        className='relative w-full h-full px-2 py-1 text-sm text-gray-700 placeholder-gray-400 bg-white bg-opacity-75 rounded-sm rounded-l-none focus:outline-none'
        autoFocus={true}
        id='addTodo'
        name='addTodo'
        type='text'
        placeholder='Add note...'
        value={todo.msg}
        autoComplete='off'
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
    </div>
  )
}

export default ActionInput
