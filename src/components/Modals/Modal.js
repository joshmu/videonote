import { IoMdClose as CloseIcon } from 'react-icons/io'
import { motion } from 'framer-motion'
import MotionFadeInOut from '../shared/MotionFadeInOut'

export function ModalContainer({ toggle, children, ...props }) {
  return (
    <div className='z-40' {...props}>
      <MotionFadeInOut motionKey='modal'>
        <div className='absolute w-full max-w-lg transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2'>
          <div className='relative w-full p-6 mx-auto border rounded-sm shadow-md border-themeText bg-themeBg'>
            <CloseModalBtn toggle={toggle} />
            {children}
          </div>
        </div>
      </MotionFadeInOut>
    </div>
  )
}

export const ModalHeader = ({ children }) => {
  return (
    <h2 className='text-lg font-semibold capitalize text-themeText'>
      {children}
    </h2>
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
    <div className='grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2'>{children}</div>
    {/* <div className='grid grid-cols-1 gap-6 mt-4'>{children}</div> */}
  </form>
)

export const ModalInput = ({
  title,
  id,
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

export const ModalPrimaryBtn = ({ children, ...props }) => (
  <div className='flex justify-end mt-4'>
    <button
      className='px-4 py-2 text-gray-200 bg-gray-800 rounded-sm hover:bg-gray-700 focus:outline-none focus:bg-gray-700'
      {...props}
    >
      {children}
    </button>
  </div>
)
