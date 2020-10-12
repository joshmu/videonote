import { motion } from 'framer-motion'

export default function MotionFadeUp({
  k,
  initial = {},
  animate = {},
  exit = {},
  ...props
}) {
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
