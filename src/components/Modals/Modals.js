import { useEffect } from 'react'

import { useGlobalContext } from '@/context/globalContext'
import { useVideoContext } from '@/context/videoContext'

import AboutModal from './AboutModal/AboutModal'
import CreateProjectModal from './CreateProjectModal/CreateProjectModal'
import CurrentProjectModal from './CurrentProjectModal/CurrentProjectModal'
import ProjectsModal from './ProjectsModal/ProjectsModal'
import SettingsModal from './SettingsModal/SettingsModal'
import UserAccountModal from './UserAccountModal/UserAccountModal'

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
      {modalOpen === 'about' && (
        <AboutModal toggle={toggleModalOpen} motionKey='aboutModal' />
      )}
    </>
  )
}
