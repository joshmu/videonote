import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

import { useControlsContext } from '@/context/controlsContext'
import { useGlobalContext } from '@/context/globalContext'

import AboutModal from './AboutModal/AboutModal'
import ConfirmModal from './ConfirmModal/ConfirmModal'
import CreateProjectModal from './CreateProjectModal/CreateProjectModal'
import CurrentProjectModal from './CurrentProjectModal/CurrentProjectModal'
import HelpModal from './HelpModal/HelpModal'
import ProjectsModal from './ProjectsModal/ProjectsModal'
import SettingsModal from './SettingsModal/SettingsModal'
import ShareProjectModal from './ShareProjectModal/ShareProjectModal'
import UserAccountModal from './UserAccountModal/UserAccountModal'
import WelcomeModal from './WelcomeModal/WelcomeModal'

export default function Modals() {
  const {
    modalsOpen,
    toggleModalOpen,
    promptState,
    cancelPrompt,
  } = useGlobalContext()
  const { toggleSmartControls } = useControlsContext()

  useEffect(() => {
    // disable smart controls when we have modals open
    const enableSmartControls = modalsOpen.length === 0
    toggleSmartControls(enableSmartControls)
  }, [modalsOpen])

  const checkModalOpen = modalId => modalsOpen.includes(modalId)

  return (
    <AnimatePresence>
      {checkModalOpen('current') && (
        <CurrentProjectModal
          toggle={toggleModalOpen}
          motionKey='currentProjectModal'
          key='currentProjectModal'
        />
      )}
      {checkModalOpen('create') && (
        <CreateProjectModal
          toggle={toggleModalOpen}
          motionKey='createProjectModal'
          key='currentProjectModal'
        />
      )}
      {checkModalOpen('share') && (
        <ShareProjectModal
          toggle={toggleModalOpen}
          motionKey='shareProjectModal'
          key='shareProjectModal'
        />
      )}
      {checkModalOpen('projects') && (
        <ProjectsModal
          toggle={toggleModalOpen}
          motionKey='projectsModal'
          key='projectsModal'
        />
      )}
      {checkModalOpen('settings') && (
        <SettingsModal
          toggle={toggleModalOpen}
          motionKey='settingsModal'
          key='settingsModal'
        />
      )}
      {checkModalOpen('user') && (
        <UserAccountModal
          toggle={toggleModalOpen}
          motionKey='userAccountModal'
          key='userAccountModal'
        />
      )}
      {checkModalOpen('help') && (
        <HelpModal
          toggle={toggleModalOpen}
          motionKey='helpModal'
          key='helpModal'
        />
      )}
      {checkModalOpen('about') && (
        <AboutModal
          toggle={toggleModalOpen}
          motionKey='aboutModal'
          key='aboutModal'
        />
      )}
      {checkModalOpen('welcome') && (
        <WelcomeModal
          toggle={toggleModalOpen}
          motionKey='aboutModal'
          key='aboutModal'
        />
      )}
      {promptState.isOpen && (
        <ConfirmModal
          toggle={cancelPrompt}
          motionKey='confirmModal'
          key='confirmModal'
        />
      )}
    </AnimatePresence>
  )
}
