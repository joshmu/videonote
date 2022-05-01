/**
 * @path /src/components/Sidebar/SidebarHeader/Menu/Menu.tsx
 *
 * @project videonote
 * @file Menu.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Sunday, 1st May 2022 11:23:18 am
 * @copyright © 2020 - 2020 MU
 */

import { AnimatePresence, Variants, motion } from 'framer-motion'
import Link from 'next/link'
import {
  AiOutlineFile as ProjectIcon,
  AiOutlineUnorderedList as ProjectsIcon,
  AiOutlineShareAlt as ShareIcon,
} from 'react-icons/ai'
import { IoIosHelpCircleOutline as HelpIcon } from 'react-icons/io'
import { MdAdd as CreateIcon } from 'react-icons/md'
import {
  RiLightbulbFlashLine as AboutIcon,
  RiUserSettingsLine as AccountIcon,
  RiLogoutBoxLine as SignoutIcon,
} from 'react-icons/ri'
import { VscSettings as SettingsIcon } from 'react-icons/vsc'
import Cookie from 'universal-cookie'

import { ModalType } from '@/components/Modals/Modals'
import { useGlobalContext } from '@/context/globalContext'
import { useThemeContext } from '@/context/themeContext'
import { Select } from '@/shared/Select/Select'
import { ThemeToggle } from '@/shared/ThemeToggle/ThemeToggle'

import { IconMenuItemWrapper } from './IconMenuItemWrapper/IconMenuItemWrapper'

const variants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.1,
    },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

export const Menu = () => {
  const { menuOpen } = useGlobalContext()
  const { toggleMenuOpen, toggleModalOpen, project, admin, projects } =
    useGlobalContext()
  const { toggleTheme } = useThemeContext()

  const handleModalOpen = (modalId: ModalType): void => {
    toggleModalOpen(modalId)
    toggleMenuOpen()
  }

  const handleSignOutClick = (): void => {
    // remove JWT token cookie
    const cookies = new Cookie()
    cookies.remove('token')
  }

  const handleThemeToggleClick = (): void => {
    toggleTheme()
  }

  const handleMouseLeave = (): void => {
    toggleMenuOpen(false)
  }

  return (
    <div>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key='optionsDropdown'
            initial='initial'
            animate='animate'
            exit='exit'
            variants={variants}
            onMouseLeave={handleMouseLeave}
            className='absolute z-40 w-48 py-2 text-sm capitalize transition-colors duration-300 ease-in-out border rounded-sm shadow-xl right-2 top-7 bg-themeBg'
          >
            {project && admin && (
              <Select
                onClick={() => handleModalOpen(ModalType.CURRENT_PROJECT)}
                text='text-themeAccent'
              >
                <IconMenuItemWrapper>
                  <ProjectIcon />
                </IconMenuItemWrapper>
                <span className='font-serif font-semibold tracking-wide uppercase'>
                  {project.title}
                </span>
              </Select>
            )}
            {!admin && (
              <div className='flex items-center px-4 py-2 uppercase text-themeAccent'>
                {project.title}
              </div>
            )}

            {admin && project && (
              <Select onClick={() => handleModalOpen(ModalType.SHARE_PROJECT)}>
                <IconMenuItemWrapper>
                  <ShareIcon />
                </IconMenuItemWrapper>
                Share Project
              </Select>
            )}

            {admin && (
              <Select
                onClick={() => handleModalOpen(ModalType.CREATE_PROJECT)}
                animate={
                  projects.length === 0 ? 'animate-pulse text-themeAccent' : ''
                }
              >
                <IconMenuItemWrapper>
                  <CreateIcon />
                </IconMenuItemWrapper>
                create new
              </Select>
            )}

            {admin && projects.length > 0 && (
              <Select onClick={() => handleModalOpen(ModalType.PROJECTS)}>
                <IconMenuItemWrapper>
                  <ProjectsIcon />
                </IconMenuItemWrapper>
                projects
              </Select>
            )}

            <Select onClick={() => handleModalOpen(ModalType.SETTINGS)}>
              <IconMenuItemWrapper>
                <SettingsIcon />
              </IconMenuItemWrapper>
              settings
            </Select>

            {admin && (
              <Select onClick={() => handleModalOpen(ModalType.USER_ACCOUNT)}>
                <IconMenuItemWrapper>
                  <AccountIcon />
                </IconMenuItemWrapper>
                account
              </Select>
            )}
            {admin && (
              <a href='/api/auth/logout'>
                <Select onClick={() => {}}>
                  <IconMenuItemWrapper>
                    <SignoutIcon />
                  </IconMenuItemWrapper>
                  Sign Out
                </Select>
              </a>
            )}

            <Select onClick={handleThemeToggleClick}>
              <IconMenuItemWrapper>
                <ThemeToggle />
              </IconMenuItemWrapper>
              Theme
            </Select>

            <Select onClick={() => handleModalOpen(ModalType.HELP)}>
              <IconMenuItemWrapper>
                <HelpIcon />
              </IconMenuItemWrapper>
              Help
            </Select>

            <Select onClick={() => handleModalOpen(ModalType.ABOUT)}>
              <IconMenuItemWrapper>
                <AboutIcon />
              </IconMenuItemWrapper>
              About VideoNote
            </Select>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
