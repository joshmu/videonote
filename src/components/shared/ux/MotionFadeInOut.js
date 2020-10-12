import { motion } from 'framer-motion'

export default function MotionFadeInOut({
  motionKey,
  duration = 0.2,
  variants = undefined,
  ...props
}) {
  if (!variants)
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
    }

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
