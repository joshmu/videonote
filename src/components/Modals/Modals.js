import { useGlobalContext } from '../../context/globalContext'
import AccountModal from './AccountModal'
import CreateProjectModal from './CreateProjectModal'
import ProjectsModal from './ProjectsModal'
import SettingsModal from './SettingsModal'

export default function Modals() {
  const { modalOpen, toggleModalOpen } = useGlobalContext()

  return (
    <>
      {/* overlay is shown whilst a modal is open */}
      {modalOpen && <ModalOverlay toggle={toggleModalOpen} />}

      {/* modals */}
      {modalOpen === 'create' && (
        <CreateProjectModal toggle={toggleModalOpen} />
      )}
      {modalOpen === 'projects' && <ProjectsModal toggle={toggleModalOpen} />}
      {modalOpen === 'settings' && <SettingsModal toggle={toggleModalOpen} />}
      {modalOpen === 'account' && <AccountModal toggle={toggleModalOpen} />}
    </>
  )
}

export const ModalOverlay = ({ toggle }) => {
  const handleOverlayClick = () => {
    toggle()
  }

  return (
    <div
      onClick={handleOverlayClick}
      className='absolute top-0 bottom-0 left-0 right-0 z-40 bg-black bg-opacity-50'
    ></div>
  )
}
