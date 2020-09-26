import { useGlobalContext } from '../../context/globalContext'
import AccountModal from '../AccountModal/AccountModal'
import CreateProjectModal from '../CreateProjectModal/CreateProjectModal'
import ProjectsModal from '../ProjectsModal/ProjectsModal'
import SettingsModal from '../SettingsModal/SettingsModal'
import { IoMdClose as CloseIcon } from 'react-icons/io'
import { motion } from 'framer-motion'

export default function Modals() {
  const { modalOpen, toggleModalOpen } = useGlobalContext()

  const handleOverlayClick = () => {
    toggleModalOpen()
  }

  return (
    <>
      {/* overlay is shown whilst a modal is open */}
      {modalOpen && (
        <div
          onClick={handleOverlayClick}
          className='absolute top-0 bottom-0 left-0 right-0 z-40 bg-black bg-opacity-50'
        ></div>
      )}

      {/* modals */}
      <div className='z-50'>
        {modalOpen === 'create' && (
          <CreateProjectModal toggle={toggleModalOpen} />
        )}
        {modalOpen === 'projects' && <ProjectsModal toggle={toggleModalOpen} />}
        {modalOpen === 'settings' && (
          <SettingsModal
            toggle={toggleModalOpen}
            CloseBtn={() => CloseModalBtn(toggleModalOpen)}
          />
        )}
        {modalOpen === 'account' && (
          <AccountModal
            toggle={toggleModalOpen}
            CloseBtn={() => CloseModalBtn(toggleModalOpen)}
          />
        )}
      </div>
    </>
  )
}

const CloseModalBtn = toggle => {
  const handleClose = () => toggle()

  return (
    <motion.div
      onClick={handleClose}
      className='absolute top-0 right-0 p-1 text-xl cursor-pointer'
      whileHover={{
        rotate: 90,
      }}
    >
      <CloseIcon />
    </motion.div>
  )
}
