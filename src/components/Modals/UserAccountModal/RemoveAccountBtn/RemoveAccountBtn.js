import { motion } from 'framer-motion'

const RemoveAccountBtn = ({ handleClick }) => {
  return (
    <div className='flex items-center mt-4'>
      <motion.button
        whileHover={{ scale: 0.9, transition: { duration: 0.1 } }}
        className='px-6 py-2 italic bg-red-400 rounded-sm text-themeBg focus:outline-none'
        onClick={handleClick}
      >
        Remove Account
      </motion.button>
    </div>
  )
}

export default RemoveAccountBtn
