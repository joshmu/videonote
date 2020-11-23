/**
 * @path /src/components/shared/ux/MotionFadeUp.tsx
 *
 * @project videonote
 * @file MotionFadeUp.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Friday, 25th September 2020
 * @modified Monday, 23rd November 2020 3:28:24 pm
 * @copyright © 2020 - 2020 MU
 */

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface MotionFadeUpProps {
  k: string
  initial?: object
  animate?: object
  exit?: object
  className: string
  children: ReactNode
  props?: { [key: string]: any }
}

export const MotionFadeUp = ({
  k,
  initial = {},
  animate = {},
  exit = {},
  ...props
}: MotionFadeUpProps) => {
  const variants = {
    initial: {
      opacity: 0,
      y: 10,
      ...initial,
    },
    animate: {
      opacity: 1,
      y: 0,
      ...animate,
    },
    exit: {
      opacity: 0,
      ...exit,
    },
  }
  return (
    <motion.div
      key={k}
      initial='initial'
      animate='animate'
      exit='exit'
      variants={variants}
      {...props}
    ></motion.div>
  )
}
