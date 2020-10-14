import { motion } from 'framer-motion'

const ModalPrimaryBtn = ({ className = '', handleClick, children }) => (
  <div className={`${className} flex justify-end mt-4`}>
    <motion.button
      whileHover={{ scale: 0.9, transition: { duration: 0.1 } }}
      type='submit'
      className='px-6 py-2 rounded-sm text-themeBg bg-highlight-400 focus:outline-none'
      onClick={handleClick}
    >
      {children}
    </motion.button>
  </div>
)

export default ModalPrimaryBtn
