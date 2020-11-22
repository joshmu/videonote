/**
 * @path /src/components/shared/CancelBtn/CancelBtn.tsx
 *
 * @project videonote
 * @file CancelBtn.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 12th October 2020
 * @modified Sunday, 22nd November 2020 3:18:48 pm
 * @copyright © 2020 - 2020 MU
 */

import { motion } from 'framer-motion'
import { IoMdClose as CloseIcon } from 'react-icons/io'

export const CancelBtn = ({ cancel }: { cancel: () => void }) => {
  const handleClick = (): void => cancel()

  return (
    <motion.div
      onClick={handleClick}
      className='absolute top-0 right-0 p-2 text-xl transition-colors duration-300 ease-in-out cursor-pointer hover:text-themeAccent text-themeText2'
      whileHover={{
        rotate: 90,
      }}
    >
      <CloseIcon />
    </motion.div>
  )
}
