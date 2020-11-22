/**
 * @path /src/components/shared/Modal/ModalBtn.tsx
 *
 * @project videonote
 * @file ModalBtn.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 12th October 2020
 * @modified Sunday, 22nd November 2020 5:12:38 pm
 * @copyright © 2020 - 2020 MU
 */

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ModalPrimaryBtnInterface {
  handleClick: (event: any) => any
  type?: string
  color?: string
  children: ReactNode
}

export const ModalPrimaryBtn = ({
  handleClick,
  type = 'submit',
  color = '',
  children,
}: ModalPrimaryBtnInterface) => (
  <div className='flex justify-end mt-4'>
    <motion.button
      whileHover={{ scale: 0.9, transition: { duration: 0.1 } }}
      // @ts-ignore
      type={type}
      className={`${
        color.length > 0 ? color : 'bg-themeAccent'
      } px-6 py-2 rounded-sm text-themeBg transition-colors duration-300 ease-in-out focus:outline-none`}
      onClick={handleClick}
    >
      {children}
    </motion.button>
  </div>
)
