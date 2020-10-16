import { useEffect, useState } from 'react'

const CONFIRMATION_DEFAULTS = {
  open: false,
  msg: 'Are you sure?',
  confirm: null,
  action: null,
}

const useConfirmation = () => {
  const [confirmation, setConfirmation] = useState(CONFIRMATION_DEFAULTS)

  useEffect(() => {
    // when confirmation is open and and answer is given
    if (confirmation.open && confirmation.confirm !== null) {
      // fire provided action if user confirms
      if (confirmation.confirm && confirmation.action) confirmation.action()
      // reset confirmation state
      reset()
    }
  }, [confirmation])

  const confirmationPrompt = ({ msg, action }) => {
    // open confirmation modal with custom msg
    setConfirmation(current => ({ ...current, open: true, msg, action }))
    // user response (do this in the modal)
    // return response
  }

  const confirm = () =>
    setConfirmation(current => ({ ...current, confirm: true }))

  const reset = () => setConfirmation(CONFIRMATION_DEFAULTS)

  return { confirmation, confirmationPrompt, confirm, reset }
}

export default useConfirmation
