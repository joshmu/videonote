import { motion } from 'framer-motion'

export const VideoBackground = () => (
  <motion.div
    key='neu-video-image-bg'
    initial={{
      opacity: 0,
    }}
    animate={{ opacity: 1, transition: { delay: 0.8 } }}
    exit={{ opacity: 0 }}
    className='flex items-center justify-center w-full h-full'
  >
    <div className='w-3/4 neu-accent h-1/2'></div>
  </motion.div>
)
