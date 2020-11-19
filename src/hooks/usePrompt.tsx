import { ReactElement, useState } from 'react'

const DEFAULTS = {
  isOpen: false,
  msg: 'Are you sure?',
  action: null,
  passwordRequired: false,
}

export interface PromptInterface {
  isOpen?: boolean
  msg: string | ReactElement
  action: any
  passwordRequired?: boolean
}
export type CreatePromptType = (promptData: PromptInterface) => void
export type ConfirmPromptType = (promptData: PromptInterface) => void
export type CancelPromptType = () => void

export const usePrompt = (): {
  promptState: PromptInterface
  createPrompt: CreatePromptType
  confirmPrompt: ConfirmPromptType
  cancelPrompt: CancelPromptType
} => {
  const [state, setState] = useState<PromptInterface>(DEFAULTS)

  const createPrompt: CreatePromptType = ({
    msg,
    action,
    passwordRequired = false,
  }) => {
    // open prompt modal with custom msg
    setState(current => ({
      ...current,
      isOpen: true,
      msg,
      passwordRequired,
      action,
    }))
  }

  const confirmPrompt: ConfirmPromptType = data => {
    // when user confirms, fire callback action
    state.action(data)
    cancelPrompt()
  }

  const cancelPrompt: CancelPromptType = () => {
    // close prompt first so we don't see data change
    setState(current => ({ ...current, isOpen: false }))
    // apply slight delay to account for animations
    setTimeout(() => {
      setState(DEFAULTS)
    }, 300)
  }

  return { promptState: state, createPrompt, confirmPrompt, cancelPrompt }
}
