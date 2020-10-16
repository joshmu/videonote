import { useState } from 'react'

const CONFIRMATION_DEFAULTS = {
  isOpen: false,
  msg: 'Are you sure?',
  action: null,
  passwordRequired: false,
}

const useConfirmation = () => {
  const [confirmation, setConfirmation] = useState(CONFIRMATION_DEFAULTS)

  const confirmationPrompt = ({ msg, action, passwordRequired = false }) => {
    // open confirmation modal with custom msg
    setConfirmation(current => ({
      ...current,
      isOpen: true,
      msg,
      passwordRequired,
      action,
    }))
  }

  const confirm = data => {
    // when user confirms, fire callback action
    confirmation.action(data)
    reset()
  }

  const reset = () => {
    // close prompt first so we don't see data change
    setConfirmation(current => ({ ...current, isOpen: false }))
    // apply slight delay to account for animations
    setTimeout(() => {
      setConfirmation(CONFIRMATION_DEFAULTS)
    }, 300)
  }

  return { confirmation, confirmationPrompt, confirm, reset }
}

export default useConfirmation
