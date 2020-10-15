import { motion } from 'framer-motion'

const ModalPrimaryBtn = ({
  handleClick,
  type = 'submit',
  color = '',
  children,
}) => (
  <div className='flex justify-end mt-4'>
    <motion.button
      whileHover={{ scale: 0.9, transition: { duration: 0.1 } }}
      // @ts-ignore
      type={type}
      className={`${
        color.length > 0 ? color : 'bg-themeAccent'
      } px-6 py-2 rounded-sm text-themeBg transition-colors duration-300 ease-in-out focus:outline-none`}
      onClick={handleClick}
    >
      {children}
    </motion.button>
  </div>
)

export default ModalPrimaryBtn
