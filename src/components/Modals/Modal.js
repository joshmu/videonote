import { IoMdClose as CloseIcon } from 'react-icons/io'
import { motion } from 'framer-motion'
import MotionFadeInOut from '../shared/MotionFadeInOut'

export function ModalContainer({
  toggle,
  children,
  motionKey = 'modal',
  ...props
}) {
  return (
    <div
      className='absolute z-40 w-full max-w-lg transform -translate-x-1/2 -translate-y-1/2 max-h-11/12 top-1/2 left-1/2'
      {...props}
    >
      <div className='relative w-full p-6 mx-auto border rounded-sm shadow-md border-themeText bg-themeBg'>
        <CloseModalBtn toggle={toggle} />
        {children}
      </div>
    </div>
  )
}

export const ModalHeader = ({ children }) => {
  return (
    <div className='mb-6 -ml-12'>
      <div className='w-4/5 py-2 text-themeBg bg-themeText'>
        <span className='pl-8 text-lg font-semibold uppercase'>{children}</span>
      </div>
    </div>
  )
}

export const ModalInnerContainer = ({ children }) => {
  return (
    <div className='overflow-y-scroll max-h-80vh scrollbar'>{children}</div>
  )
}

export const CloseModalBtn = ({ toggle }) => {
  const handleClose = () => toggle()

  return (
    <motion.div
      onClick={handleClose}
      className='absolute top-0 right-0 p-2 text-xl transition-colors duration-300 ease-in-out cursor-pointer hover:text-highlight-400 text-highlight-700'
      whileHover={{
        rotate: 90,
      }}
    >
      <CloseIcon />
    </motion.div>
  )
}

export const ModalForm = ({ children }) => (
  <form>
    <div className='grid grid-cols-1 gap-6 mt-2 sm:grid-cols-2'>{children}</div>
    {/* <div className='grid grid-cols-1 gap-6 mt-4'>{children}</div> */}
  </form>
)

export const ModalInput = ({
  title = '',
  id = '',
  type = 'text',
  placeholder = '',
  ...props
}) => {
  return (
    <div>
      <label className='text-themeText' htmlFor={id}>
        {title}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className='block w-full px-4 py-2 mt-2 border rounded-sm border-themeText2 text-themeText bg-themeBg focus:border-themeText focus:outline-none'
        {...props}
      />
    </div>
  )
}

export const ModalPrimaryBtn = ({ className = '', children, ...props }) => (
  <>
    <div className='h-10'></div>
    <div></div>
    <div
      className={`${className} flex justify-end mt-4 absolute bottom-6 -right-6`}
    >
      <motion.button
        whileHover={{ scale: 0.9, transition: { duration: 0.1 } }}
        type='submit'
        className='w-40 py-2 bg-opacity-100 rounded-sm text-themeBg bg-highlight-400 focus:outline-none'
        {...props}
      >
        {children}
      </motion.button>
    </div>
  </>
)

export const PrimaryBtn = ({ children, ...props }) => (
  <motion.button
    whileHover={{ scale: 0.9, transition: { duration: 0.1 } }}
    className='px-6 py-2 bg-opacity-100 rounded-sm text-themeBg bg-highlight-400 focus:outline-none'
    {...props}
  >
    {children}
  </motion.button>
)
