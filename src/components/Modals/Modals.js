import { useEffect } from 'react'
import { useGlobalContext } from '../../context/globalContext'
import { useVideoContext } from '../../context/videoContext'
import UserAccountModal from './UserAccountModal'
import CreateProjectModal from './CreateProjectModal'
import CurrentProjectModal from './CurrentProjectModal'
import ProjectsModal from './ProjectsModal'
import SettingsModal from './SettingsModal'

export default function Modals() {
  const { modalOpen, toggleModalOpen } = useGlobalContext()
  const { toggleSmartControls } = useVideoContext()

  useEffect(() => {
    const cmd = !modalOpen
    toggleSmartControls(cmd)
  }, [modalOpen])

  return (
    <>
      {modalOpen === 'current' && (
        <CurrentProjectModal toggle={toggleModalOpen} />
      )}
      {modalOpen === 'create' && (
        <CreateProjectModal toggle={toggleModalOpen} />
      )}
      {modalOpen === 'projects' && <ProjectsModal toggle={toggleModalOpen} />}
      {modalOpen === 'settings' && <SettingsModal toggle={toggleModalOpen} />}
      {modalOpen === 'user' && <UserAccountModal toggle={toggleModalOpen} />}
    </>
  )
}
