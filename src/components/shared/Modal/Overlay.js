import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { useGlobalContext } from '@/context/globalContext'

export default function Overlay() {
  const [open, setOpen] = useState(false)
  const {
    modalsOpen,
    toggleModalOpen,
    confirmation,
    confirmationCancel,
  } = useGlobalContext()

  useEffect(() => {
    if (modalsOpen.length > 0 || confirmation.isOpen) setOpen(true)
    if (modalsOpen.length === 0 && !confirmation.isOpen) setOpen(false)
  }, [modalsOpen, confirmation])

  const handleOverlayClick = () => {
    setOpen(false)
    if (confirmation.isOpen) confirmationCancel()
    if (modalsOpen.length > 0) toggleModalOpen()
  }

  const variants = {
    initial: {
      opacity: 0,
    },
    animate: {
      opacity: 1,
      transition: { duration: 0.2 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key='overlay'
          initial='initial'
          animate='animate'
          exit='exit'
          variants={variants}
          onClick={handleOverlayClick}
          className={`${
            confirmation.isOpen ? 'z-40 bg-opacity-75' : 'z-10 bg-opacity-50'
          } absolute top-0 bottom-0 left-0 right-0 bg-black`}
        ></motion.div>
      )}
    </AnimatePresence>
  )
}
