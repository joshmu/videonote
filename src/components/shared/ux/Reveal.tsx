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

import { Variants, motion, useAnimation } from 'framer-motion'
import { ReactNode, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'

interface RevealProps {
  children: ReactNode
  variants?: Variants
  transition?: { [key: string]: any }
  props?: { [key: string]: any }
}

export const Reveal = ({
  children,
  variants = null,
  transition = null,
  ...props
}: RevealProps) => {
  const controls = useAnimation()
  const [ref, inView] = useInView()

  useEffect(() => {
    if (inView) controls.start('animate')
  }, [controls, inView])

  return (
    <motion.div
      ref={ref}
      initial='initial'
      animate={controls}
      exit='exit'
      variants={{
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 10 },
        ...variants,
      }}
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
