import { useGlobalContext } from '../../context/globalContext'
import AccountModal from '../AccountModal/AccountModal'
import CreateProjectModal from '../CreateProjectModal/CreateProjectModal'
import ProjectsModal from '../ProjectsModal/ProjectsModal'
import SettingsModal from '../SettingsModal/SettingsModal'

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
        {modalOpen === 'settings' && <SettingsModal toggle={toggleModalOpen} />}
        {modalOpen === 'account' && <AccountModal toggle={toggleModalOpen} />}
      </div>
    </>
  )
}
