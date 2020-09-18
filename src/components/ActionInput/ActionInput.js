import { useRef, useEffect } from 'react'

const ActionInput = () => {
  const inputRef = useRef()

  // todo object = {msg: '', timestamp: 2039482093, done: false}

  // * listen to input and append timestamp when it is populated

  // * add new todo on submit
  const onSubmit = e => {
    e.preventDefault()
  }

  // * update todo on entry but exclude initial char if it is a space for play/pause logic
  const onChange = e => {
    /*
    updateNewTodo({
      // don't apply space when toggling play/pause on empty input
      msg: e.target.value === ' ' ? '' : e.target.value,
    })
    */
  }

  // * keypress logic: space = play/pause, left-right = seek, up-down = volume
  const onKeyDown = e => {}
  /*
  const onKeyDown = e => {
    // keyboard shortcuts on empty todo
    if (newTodo.msg === '') {
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
        // todo: volume?
      }
      if (e.key === 'ArrowDown') {
        // todo: volume?
      }
    }
  }
  */

  // input bar
  // timeline
  // timestamp = represents video timer and switch to todo.timestamp when there is input
  // autoFocus
  // placeholder = 'Add note...'
  // autocomplete off
  // onChange = todo content manipulation
  // onKeydown = video player logic

  return (
    <div className='relative flex flex-wrap items-stretch w-full mb-3'>
      <span className='absolute z-10 items-center justify-center w-8 h-full py-3 pl-3 text-base font-normal leading-snug text-center text-gray-400 bg-transparent rounded'>
        <i className='fas fa-lock'></i>
      </span>
      <input
        className='relative w-full px-2 py-1 pl-10 text-sm text-gray-700 placeholder-gray-400 bg-white rounded shadow outline-none focus:outline-none focus:shadow-outline'
        autoFocus={true}
        ref={inputRef}
        id='addTodo'
        name='addTodo'
        type='text'
        placeholder='Add note...'
        value={'blah'} // todo.message
        autoComplete='off'
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
    </div>
  )
}

export default ActionInput
