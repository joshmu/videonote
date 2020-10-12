import { useEffect, useState } from 'react'
import { useGlobalContext } from '@/context/globalContext'

export default function Overlay() {
  const [open, setOpen] = useState(false)
  const { modalOpen, toggleModalOpen } = useGlobalContext()

  useEffect(() => {
    if (modalOpen) setOpen(true)
    if (modalOpen === null) setOpen(false)
  }, [modalOpen])

  const handleOverlayClick = () => {
    setOpen(false)
    if (modalOpen) toggleModalOpen()
  }

  return (
    <>
      {open && (
        <div
          onClick={handleOverlayClick}
          className='absolute top-0 bottom-0 left-0 right-0 z-10 bg-black bg-opacity-50'
        ></div>
      )}
    </>
  )
}
