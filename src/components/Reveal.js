import { useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
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
    if (inView) controls.start('visible')
  }, [controls, inView])

  return (
    <>
      <motion.div
        ref={ref}
        animate={controls}
        initial='hidden'
        variants={
          variants || {
            visible: { opacity: 1, y: 0 },
            hidden: { opacity: 0, y: 25 },
          }
        }
        transition={
          transition || {
            delay: 0.4,
            duration: 0.8,
          }
        }
        {...props}
      >
        {children}
      </motion.div>
    </>
  )
}
