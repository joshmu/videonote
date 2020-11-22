/**
 * @path /src/components/shared/Modal/ModalContainer.js
 *
 * @project videonote
 * @file ModalContainer.js
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Sunday, 27th September 2020
 * @modified Sunday, 22nd November 2020 3:19:42 pm
 * @copyright © 2020 - 2020 MU
 */

import { motion } from 'framer-motion'

import { CancelBtn } from '@/shared/CancelBtn/CancelBtn'

const ModalContainer = ({
  toggle,
  children,
  motionKey = 'modal',
  zIndex = null,
  ...props
}) => {
  const variants = {
    initial: { opacity: 0, y: '-40%', x: '-50%' },
    animate: { opacity: 1, y: '-50%', transition: { duration: 0.2 } },
    exit: { opacity: 0, y: '-60%', transition: { duration: 0.2 } },
  }

  return (
    <motion.div
      key={motionKey}
      initial='initial'
      animate='animate'
      exit='exit'
      variants={variants}
      className={`${
        zIndex ? zIndex : 'z-30'
      } absolute w-full max-w-lg transform -translate-x-1/2 -translate-y-1/2 max-h-11/12 top-1/2 left-1/2`}
      {...props}
    >
      <div className='relative w-full p-6 mx-auto border rounded-sm shadow-md border-themeText bg-themeBg'>
        <CancelBtn cancel={toggle} />
        {children}
      </div>
    </motion.div>
  )
}

export default ModalContainer
