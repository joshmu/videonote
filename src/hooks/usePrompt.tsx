/**
 * @path /src/hooks/usePrompt.tsx
 *
 * @project videonote
 * @file usePrompt.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Friday, 16th October 2020
 * @modified Sunday, 22nd November 2020 6:18:24 pm
 * @copyright © 2020 - 2020 MU
 */

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
  action: (callbackData: { [key: string]: string | number }) => void
  passwordRequired?: boolean
}
export type CreatePromptType = (promptData: PromptInterface) => void
export type ConfirmPromptType = (confirmPromptData: {
  password?: string
}) => void
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

  const confirmPrompt: ConfirmPromptType = callbackData => {
    // when user confirms, fire callback action
    state.action(callbackData)
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
