/**
 * @path /src/components/shared/Toggle/Toggle.tsx
 *
 * @project videonote
 * @file Toggle.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 28th September 2020
 * @modified Monday, 23rd November 2020 3:13:19 pm
 * @copyright © 2020 - 2020 MU
 */

import { MouseEventHandler } from 'react'
import {
  FiCheckCircle as CheckIcon,
  FiCircle as CircleIcon,
} from 'react-icons/fi'

export const Toggle = ({
  state,
  onClick,
}: {
  state: boolean
  onClick: MouseEventHandler
}) => {
  return (
    <div onClick={onClick} className='cursor-pointer'>
      {state ? <CheckIcon /> : <CircleIcon />}
    </div>
  )
}

export const ToggleInput = ({
  title,
  state,
  onClick,
}: {
  title: string
  state: boolean
  onClick: MouseEventHandler
}) => {
  return (
    <div className='flex items-center gap-2'>
      <Toggle state={state} onClick={onClick} />
      <p onClick={onClick} className='cursor-pointer'>
        {title}
      </p>
    </div>
  )
}
