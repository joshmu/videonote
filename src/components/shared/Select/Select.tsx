/**
 * @path /src/components/shared/Select/Select.tsx
 *
 * @project videonote
 * @file Select.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Sunday, 27th September 2020
 * @modified Sunday, 22nd November 2020 3:29:31 pm
 * @copyright © 2020 - 2020 MU
 */

import { ReactNode } from 'react'

type SelectProps = {
  children: ReactNode
  modalId?: string
  padding?: string
  animate?: string
  text?: string
  cursor?: string
  props?: {}
}

export const Select = ({
  children,
  modalId = null,
  padding = 'px-4 py-2',
  animate = '',
  text = 'text-themeText',
  cursor = 'cursor-pointer',
  ...props
}: SelectProps) => {
  return (
    <div
      data-modal={modalId}
      className={`${padding} ${animate} flex items-center ${cursor} ${text} hover:bg-themeSelect hover:text-white`}
      {...props}
    >
      {children}
    </div>
  )
}
