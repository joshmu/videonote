/**
 * @path /src/components/shared/Modal/ModalInnerContainer.tsx
 *
 * @project videonote
 * @file ModalInnerContainer.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 12th October 2020
 * @modified Sunday, 22nd November 2020 4:43:25 pm
 * @copyright © 2020 - 2020 MU
 */

import { ReactNode } from 'react'

export const ModalInnerContainer = ({ children }: { children: ReactNode }) => {
  return (
    <div className='overflow-y-scroll max-h-80vh scrollbar'>{children}</div>
  )
}
