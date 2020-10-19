import { motion } from 'framer-motion'
import { IoMdClose as CloseIcon } from 'react-icons/io'

const CancelBtn = ({ cancel }) => {
  const handleClick = () => cancel()

  return (
    <motion.div
      onClick={handleClick}
      className='absolute top-0 right-0 p-2 text-xl transition-colors duration-300 ease-in-out cursor-pointer hover:text-themeAccent text-themeText2'
      whileHover={{
        rotate: 90,
      }}
    >
      <CloseIcon />
    </motion.div>
  )
}

export default CancelBtn
