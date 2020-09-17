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
    <div>
      <form onSubmit={onSubmit}>
        <label htmlFor='addTodo'></label>
        <input
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
      </form>
    </div>
  )
}

export default ActionInput
