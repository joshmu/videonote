import { useGlobalContext } from '../../context/globalContext'
import AccountModal from '../AccountModal/AccountModal'
import CreateProjectModal from '../CreateProjectModal/CreateProjectModal'
import ProjectsModal from '../ProjectsModal/ProjectsModal'

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
          className='absolute top-0 bottom-0 left-0 right-0 bg-black bg-opacity-50'
        ></div>
      )}

      <AccountModal open={modalOpen === 'account'} toggle={toggleModalOpen} />
      <CreateProjectModal
        open={modalOpen === 'create'}
        toggle={toggleModalOpen}
      />
      <ProjectsModal open={modalOpen === 'projects'} toggle={toggleModalOpen} />
    </>
  )
}
