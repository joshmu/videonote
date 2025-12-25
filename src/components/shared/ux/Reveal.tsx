/**
 * @path /src/components/shared/ux/Reveal.tsx
 *
 * @project videonote
 * @file Reveal.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 14th September 2020
 * @modified Monday, 23rd November 2020 3:36:56 pm
 * @copyright © 2020 - 2020 MU
 */

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  delay?: number
  duration?: number
  y?: number
  [key: string]: any
}

export const Reveal = ({
  children,
  delay = 0,
  duration = 0.6,
  y = 20,
  ...props
}: RevealProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration,
        delay: delay / 1000, // convert ms to seconds for framer-motion
        ease: 'easeOut',
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
