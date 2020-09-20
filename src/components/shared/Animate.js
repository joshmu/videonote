import { motion } from 'framer-motion'

export default function Animate({ motionKey, ...props }) {
  return (
    <motion.div
      key={motionKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.2,
        ease: [0.6, 0.05, -0.01, 0.9],
      }}
      {...props}
    ></motion.div>
  )
}
