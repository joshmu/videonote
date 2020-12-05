import { motion } from 'framer-motion'

export const NotesBackground = () => (
  <motion.div
    key='neu-notes-bg-image'
    initial={{ opacity: 0 }}
    animate={{ opacity: 1, transition: { delay: 0.8 } }}
    exit={{ opacity: 0 }}
    className='absolute z-0 flex items-center justify-center w-full h-full'
  >
    <div className='flex flex-col justify-between w-3/4 transition-colors duration-300 ease-in-out h-1/2'>
      <div className='h-1/12 neu-bg'></div>
      <div className='h-1/12 neu-bg'></div>
      <div className='h-1/12 neu-bg'></div>
      <div className='h-1/12 neu-bg'></div>
      <div className='h-1/12 neu-bg'></div>
      <div className='h-1/12 neu-bg'></div>
      <div className='h-1/12 neu-bg'></div>
      <div className='h-1/12 neu-bg'></div>
    </div>
  </motion.div>
)
