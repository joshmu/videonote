/**
 * @path /src/components/shared/Modal/Overlay.tsx
 *
 * @project videonote
 * @file Overlay.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Sunday, 27th September 2020
 * @modified Wednesday, 2nd December 2020 2:46:48 pm
 * @copyright © 2020 - 2020 MU
 */

import { AnimatePresence, Variants, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { useGlobalContext } from '@/context/globalContext'

const variants: Variants = {
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

export const Overlay = () => {
  const [open, setOpen] = useState<boolean>(false)
  const {
    modalsOpen,
    toggleModalOpen,
    promptState,
    cancelPrompt,
  } = useGlobalContext()

  useEffect(() => {
    if (modalsOpen.length > 0 || promptState.isOpen) setOpen(true)
    if (modalsOpen.length === 0 && !promptState.isOpen) setOpen(false)
  }, [modalsOpen, promptState])

  const handleOverlayClick = (): void => {
    setOpen(false)
    if (promptState.isOpen) cancelPrompt()
    if (modalsOpen.length > 0) toggleModalOpen()
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
            promptState.isOpen ? 'z-40 bg-opacity-75' : 'z-10 bg-opacity-50'
          } absolute inset-0 bg-black`}
        ></motion.div>
      )}
    </AnimatePresence>
  )
}
