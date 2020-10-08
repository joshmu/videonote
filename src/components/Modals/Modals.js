import { useEffect } from 'react'
import { useGlobalContext } from '../../context/globalContext'
import { useVideoContext } from '../../context/videoContext'
import UserAccountModal from './UserAccountModal'
import CreateProjectModal from './CreateProjectModal'
import CurrentProjectModal from './CurrentProjectModal'
import ProjectsModal from './ProjectsModal'
import SettingsModal from './SettingsModal'
import { AnimatePresence } from 'framer-motion'

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
        <CurrentProjectModal
          toggle={toggleModalOpen}
          motionKey='currentProjectModal'
        />
      )}
      {modalOpen === 'create' && (
        <CreateProjectModal
          toggle={toggleModalOpen}
          motionKey='createProjectModal'
        />
      )}
      {modalOpen === 'projects' && (
        <ProjectsModal toggle={toggleModalOpen} motionKey='projectsModal' />
      )}
      {modalOpen === 'settings' && (
        <SettingsModal toggle={toggleModalOpen} motionKey='settingsModal' />
      )}
      {modalOpen === 'user' && (
        <UserAccountModal
          toggle={toggleModalOpen}
          motionKey='userAccountModal'
        />
      )}
    </>
  )
}
