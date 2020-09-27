import { useGlobalContext } from '../../context/globalContext'
import AccountModal from './AccountModal'
import CreateProjectModal from './CreateProjectModal'
import ProjectsModal from './ProjectsModal'
import SettingsModal from './SettingsModal'

export default function Modals() {
  const { modalOpen, toggleModalOpen } = useGlobalContext()

  return (
    <>
      {modalOpen === 'create' && (
        <CreateProjectModal toggle={toggleModalOpen} />
      )}
      {modalOpen === 'projects' && <ProjectsModal toggle={toggleModalOpen} />}
      {modalOpen === 'settings' && <SettingsModal toggle={toggleModalOpen} />}
      {modalOpen === 'account' && <AccountModal toggle={toggleModalOpen} />}
    </>
  )
}
