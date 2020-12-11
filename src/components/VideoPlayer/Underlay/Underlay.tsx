/**
 * @path /src/components/VideoPlayer/Underlay/Underlay.tsx
 *
 * @project videonote
 * @file Underlay.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Friday, 11th December 2020
 * @modified Friday, 11th December 2020 10:35:43 am
 * @copyright © 2020 - 2020 MU
 */

import { AnimatePresence, Variants, motion } from 'framer-motion'

const variants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 75, transition: { duration: 0.8 } },
  exit: { opacity: 0 },
}

export const Underlay = ({ show }: { show: boolean }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key='videoUnderaly'
          initial='initial'
          animate='animate'
          exit='exit'
          variants={variants}
          className='absolute inset-0 z-0 bg-black'
        ></motion.div>
      )}
    </AnimatePresence>
  )
}
