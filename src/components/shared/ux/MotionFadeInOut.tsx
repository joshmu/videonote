/**
 * @path /src/components/shared/ux/MotionFadeInOut.tsx
 *
 * @project videonote
 * @file MotionFadeInOut.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Sunday, 20th September 2020
 * @modified Monday, 23rd November 2020 3:23:35 pm
 * @copyright © 2020 - 2020 MU
 */

import { Variants, motion } from 'framer-motion'
import { ReactNode } from 'react'

interface MotionFadeInOutProps {
  motionKey: string
  duration?: number
  variants?: Variants
  children?: ReactNode
  props?: { [key: string]: any }
}

export const MotionFadeInOut = ({
  motionKey,
  duration = 0.2,
  variants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration,
        ease: [0.6, 0.05, -0.01, 0.9],
      },
    },
    exit: { opacity: 0 },
  },
  ...props
}: MotionFadeInOutProps) => {
  return (
    <motion.div
      key={motionKey}
      initial='initial'
      animate='animate'
      exit='exit'
      variants={variants}
      {...props}
    ></motion.div>
  )
}
