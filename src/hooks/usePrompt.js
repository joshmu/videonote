import { useState } from 'react'

const DEFAULTS = {
  isOpen: false,
  msg: 'Are you sure?',
  action: null,
  passwordRequired: false,
}

const usePrompt = () => {
  const [state, setState] = useState(DEFAULTS)

  const prompt = ({ msg, action, passwordRequired = false }) => {
    // open prompt modal with custom msg
    setState(current => ({
      ...current,
      isOpen: true,
      msg,
      passwordRequired,
      action,
    }))
  }

  const confirm = data => {
    // when user confirms, fire callback action
    state.action(data)
    reset()
  }

  const reset = () => {
    // close prompt first so we don't see data change
    setState(current => ({ ...current, isOpen: false }))
    // apply slight delay to account for animations
    setTimeout(() => {
      setState(DEFAULTS)
    }, 300)
  }

  return { promptState: state, prompt, confirm, reset }
}

export default usePrompt
