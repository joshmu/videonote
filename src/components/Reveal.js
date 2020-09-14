import { useEffect } from 'react'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

export default function Reveal({
  children,
  variants = null,
  transition = null,
  ...props
}) {
  const controls = useAnimation()
  const [ref, inView] = useInView()

  useEffect(() => {
    if (inView) controls.start('animate')
  }, [controls, inView])

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial='initial'
        animate={controls}
        exit='exit'
        variants={{
          initial: { opacity: 0, y: 25 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 25 },
          ...variants,
        }}
        transition={{
          duration: 0.8,
          ease: [0.6, 0.05, -0.01, 0.9],
          ...transition,
        }}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
