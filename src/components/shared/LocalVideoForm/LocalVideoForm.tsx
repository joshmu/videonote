/**
 * @path /src/components/shared/LocalVideoForm/LocalVideoForm.tsx
 *
 * @project videonote
 * @file LocalVideoForm.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Thursday, 8th October 2020
 * @modified Sunday, 22nd November 2020 3:27:07 pm
 * @copyright © 2020 - 2020 MU
 */

import { AnimatePresence, Variants, motion } from 'framer-motion'
import { useState } from 'react'

import { LocalVideoLoader } from './LocalVideoLoader'

const variants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.4,
    },
  },
  exit: {
    opacity: 0,
  },
}

export const LocalVideoForm = ({ handleVideoSrc }) => {
  const [hover, setHover] = useState<boolean>(false)

  return (
    <>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className='h-10 mx-auto'
      >
        <LocalVideoLoader handleVideoSrc={handleVideoSrc} />
      </div>
      <div className='relative'>
        <AnimatePresence>
          {hover && (
            <motion.span
              initial='initial'
              animate='animate'
              exit='exit'
              variants={variants}
              className='absolute text-xs'
            >
              Local videos cannot be shared with other users and need to be
              re-located per session. For the best experience use web accessible
              videos.
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
