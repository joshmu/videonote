import { motion } from 'framer-motion'

export default function MotionFadeInOut({
  motionKey,
  duration = 0.2,
  ...props
}) {
  return (
    <motion.div
      key={motionKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: duration,
        ease: [0.6, 0.05, -0.01, 0.9],
      }}
      {...props}
    ></motion.div>
  )
}
