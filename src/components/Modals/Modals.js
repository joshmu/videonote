import { useEffect } from 'react'

import { useGlobalContext } from '@/context/globalContext'
import { useVideoContext } from '@/context/videoContext'

import AboutModal from './AboutModal/AboutModal'
import ConfirmModal from './ConfirmModal/ConfirmModal'
import CreateProjectModal from './CreateProjectModal/CreateProjectModal'
import CurrentProjectModal from './CurrentProjectModal/CurrentProjectModal'
import HelpModal from './HelpModal/HelpModal'
import ProjectsModal from './ProjectsModal/ProjectsModal'
import SettingsModal from './SettingsModal/SettingsModal'
import UserAccountModal from './UserAccountModal/UserAccountModal'

export default function Modals() {
  const {
    modalsOpen,
    toggleModalOpen,
    confirmation,
    confirmationCancel,
  } = useGlobalContext()
  const { toggleSmartControls } = useVideoContext()

  useEffect(() => {
    const enableSmartControls = !modalsOpen
    toggleSmartControls(enableSmartControls)
  }, [modalsOpen])

  const checkModalOpen = modalId => modalsOpen.includes(modalId)

  return (
    <>
      {checkModalOpen('current') && (
        <CurrentProjectModal
          toggle={toggleModalOpen}
          motionKey='currentProjectModal'
        />
      )}
      {checkModalOpen('create') && (
        <CreateProjectModal
          toggle={toggleModalOpen}
          motionKey='createProjectModal'
        />
      )}
      {checkModalOpen('projects') && (
        <ProjectsModal toggle={toggleModalOpen} motionKey='projectsModal' />
      )}
      {checkModalOpen('settings') && (
        <SettingsModal toggle={toggleModalOpen} motionKey='settingsModal' />
      )}
      {checkModalOpen('user') && (
        <UserAccountModal
          toggle={toggleModalOpen}
          motionKey='userAccountModal'
        />
      )}
      {checkModalOpen('help') && (
        <HelpModal toggle={toggleModalOpen} motionKey='helpModal' />
      )}
      {checkModalOpen('about') && (
        <AboutModal toggle={toggleModalOpen} motionKey='aboutModal' />
      )}
      {confirmation.open && (
        <ConfirmModal toggle={confirmationCancel} motionKey='confirmModal' />
      )}
    </>
  )
}
