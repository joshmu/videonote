/**
 * @path /src/components/shared/Modal/ModalHeader.tsx
 *
 * @project videonote
 * @file ModalHeader.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 12th October 2020
 * @modified Wednesday, 2nd December 2020 3:41:05 pm
 * @copyright © 2020 - 2020 MU
 */

import { ReactNode } from 'react'

export const ModalHeader = ({ children }: { children: ReactNode }) => {
  return (
    <div className='mb-6 -ml-12'>
      <div className='w-4/5 py-2 text-themeBg bg-themeAccent'>
        <span className='pl-8 text-lg font-semibold uppercase'>{children}</span>
      </div>
    </div>
  )
}
