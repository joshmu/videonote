/**
 * @path /src/components/shared/Modal/ModalForm.tsx
 *
 * @project videonote
 * @file ModalForm.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 12th October 2020
 * @modified Sunday, 22nd November 2020 4:56:00 pm
 * @copyright © 2020 - 2020 MU
 */

import { ReactNode } from 'react'

export const ModalForm = ({ children }: { children: ReactNode }) => (
  <form onSubmit={e => e.preventDefault()}>
    <div className='grid grid-cols-1 gap-6 mt-2 sm:grid-cols-2'>{children}</div>
  </form>
)
