/**
 * @path /src/components/Modals/Modals.tsx
 *
 * @project videonote
 * @file Modals.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Sunday, 22nd November 2020 6:24:32 pm
 * @copyright © 2020 - 2020 MU
 */

import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

import { useControlsContext } from '@/context/controlsContext'
import { useGlobalContext } from '@/context/globalContext'

import { AboutModal } from './AboutModal/AboutModal'
import { ConfirmModal } from './ConfirmModal/ConfirmModal'
import { CreateProjectModal } from './CreateProjectModal/CreateProjectModal'
import { CurrentProjectModal } from './CurrentProjectModal/CurrentProjectModal'
import { HelpModal } from './HelpModal/HelpModal'
import { ProjectsModal } from './ProjectsModal/ProjectsModal'
import { SettingsModal } from './SettingsModal/SettingsModal'
import { ShareProjectModal } from './ShareProjectModal/ShareProjectModal'
import { UserAccountModal } from './UserAccountModal/UserAccountModal'
import { WelcomeModal } from './WelcomeModal/WelcomeModal'

export enum ModalType {
  CURRENT_PROJECT = 'current project',
  CREATE_PROJECT = 'create project',
  SHARE_PROJECT = 'share project',
  PROJECTS = 'projects list',
  SETTINGS = 'settings',
  USER_ACCOUNT = 'user account',
  HELP = 'help information',
  ABOUT = 'about videonote',
  WELCOME = 'welcome information',
}

export const Modals = () => {
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

  const checkModalOpen = (id: ModalType): boolean => modalsOpen.includes(id)

  return (
    <AnimatePresence>
      {checkModalOpen(ModalType.CURRENT_PROJECT) && (
        <CurrentProjectModal
          toggle={toggleModalOpen}
          motionKey='currentProjectModal'
          key='currentProjectModal'
        />
      )}
      {checkModalOpen(ModalType.CREATE_PROJECT) && (
        <CreateProjectModal
          toggle={toggleModalOpen}
          motionKey='createProjectModal'
          key='currentProjectModal'
        />
      )}
      {checkModalOpen(ModalType.SHARE_PROJECT) && (
        <ShareProjectModal
          toggle={toggleModalOpen}
          motionKey='shareProjectModal'
          key='shareProjectModal'
        />
      )}
      {checkModalOpen(ModalType.PROJECTS) && (
        <ProjectsModal
          toggle={toggleModalOpen}
          motionKey='projectsModal'
          key='projectsModal'
        />
      )}
      {checkModalOpen(ModalType.SETTINGS) && (
        <SettingsModal
          toggle={toggleModalOpen}
          motionKey='settingsModal'
          key='settingsModal'
        />
      )}
      {checkModalOpen(ModalType.USER_ACCOUNT) && (
        <UserAccountModal
          toggle={toggleModalOpen}
          motionKey='userAccountModal'
          key='userAccountModal'
        />
      )}
      {checkModalOpen(ModalType.HELP) && (
        <HelpModal
          toggle={toggleModalOpen}
          motionKey='helpModal'
          key='helpModal'
        />
      )}
      {checkModalOpen(ModalType.ABOUT) && (
        <AboutModal
          toggle={toggleModalOpen}
          motionKey='aboutModal'
          key='aboutModal'
        />
      )}
      {checkModalOpen(ModalType.WELCOME) && (
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
