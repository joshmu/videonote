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

import { Variants, motion } from 'framer-motion'
import { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  variants?: Variants
  transition?: { [key: string]: any }
  props?: { [key: string]: any }
}

const defaultVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

export const Reveal = ({
  children,
  variants = {},
  transition = {},
  ...props
}: RevealProps) => {
  const mergedVariants = {
    hidden: { ...defaultVariants.hidden, ...variants.initial },
    visible: { ...defaultVariants.visible, ...variants.animate },
  }

  return (
    <motion.div
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true, amount: 0.1 }}
      variants={mergedVariants}
      transition={{
        duration: 0.6,
        ease: [0.6, 0.05, -0.01, 0.9],
        ...transition,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
