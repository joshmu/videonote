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

import { ReactElement, useEffect, useRef, useState } from "react";

const DEFAULTS = {
  isOpen: false,
  msg: "Are you sure?",
  action: null,
  passwordRequired: false,
};

export interface PromptInterface {
  isOpen?: boolean;
  msg: string | ReactElement;
  action: (callbackData: { [key: string]: string | number }) => void;
  passwordRequired?: boolean;
  /** Called when the prompt is dismissed without confirming. */
  onCancel?: () => void;
}
export type CreatePromptType = (promptData: PromptInterface) => void;
export type ConfirmPromptType = (confirmPromptData: { password?: string }) => void;
export type CancelPromptType = () => void;

export const usePrompt = (): {
  promptState: PromptInterface;
  createPrompt: CreatePromptType;
  confirmPrompt: ConfirmPromptType;
  cancelPrompt: CancelPromptType;
} => {
  const [state, setState] = useState<PromptInterface>(DEFAULTS);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const createPrompt: CreatePromptType = ({
    msg,
    action,
    passwordRequired = false,
    onCancel = undefined,
  }) => {
    // a pending reset from the last prompt must not wipe this one
    clearTimeout(resetTimer.current);
    // open prompt modal with custom msg
    setState((current) => ({
      ...current,
      isOpen: true,
      msg,
      passwordRequired,
      action,
      onCancel,
    }));
  };

  const confirmPrompt: ConfirmPromptType = (callbackData) => {
    // when user confirms, fire callback action
    state.action(callbackData);
    closePrompt();
  };

  const cancelPrompt: CancelPromptType = () => {
    if (state.isOpen) state.onCancel?.();
    closePrompt();
  };

  const closePrompt = (): void => {
    // close prompt first so we don't see data change
    setState((current) => ({ ...current, isOpen: false }));
    // apply slight delay to account for animations
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      setState(DEFAULTS);
    }, 300);
  };

  return { promptState: state, createPrompt, confirmPrompt, cancelPrompt };
};
