import { useState } from 'react'
import LocalVideoLoader from './LocalVideoLoader'
import { AnimatePresence, motion } from 'framer-motion'

export default function LocalVideoForm({ handleVideoSrc }) {
  const [hover, setHover] = useState(false)

  const variants = {
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
