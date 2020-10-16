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
    if (modalsOpen.length > 0) setOpen(true)
    if (modalsOpen.length === 0) setOpen(false)
  }, [modalsOpen])

  const handleOverlayClick = () => {
    setOpen(false)
    if (confirmation.open) confirmationCancel()
    if (modalsOpen.length > 0) toggleModalOpen()
  }

  return (
    <>
      {open && (
        <div
          onClick={handleOverlayClick}
          className={`${
            confirmation.open ? 'z-40 bg-opacity-75' : 'z-10 bg-opacity-50'
          } absolute top-0 bottom-0 left-0 right-0 bg-black`}
        ></div>
      )}
    </>
  )
}
