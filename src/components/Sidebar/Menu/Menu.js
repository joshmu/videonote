import { AnimatePresence, motion } from 'framer-motion'
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

import Select from '@/components/shared/Select/Select'
import ThemeToggle from '@/components/shared/ThemeToggle/ThemeToggle'
import { useGlobalContext } from '@/context/globalContext'
import { useThemeContext } from '@/context/themeContext'

import IconMenuItemWrapper from './IconMenuItemWrapper/IconMenuItemWrapper'

const Menu = ({ open }) => {
  const {
    toggleMenuOpen,
    toggleModalOpen,
    project,
    admin,
    updateProject,
    copyToClipboard,
    projects,
  } = useGlobalContext()
  const { toggleTheme } = useThemeContext()

  const handleClick = e => {
    const modalId = e.target.getAttribute('data-modal')
    toggleModalOpen(modalId)
    toggleMenuOpen()
  }

  const handleSignOutClick = () => {
    // remove JWT token cookie
    const cookies = new Cookie()
    cookies.remove('token')
  }

  const handleThemeToggleClick = () => {
    toggleTheme()
  }

  const handleMouseLeave = () => {
    toggleMenuOpen(false)
  }

  const handleShareProject = () => {
    // set sharing by switching off isPrivate
    updateProject({ isPrivate: false })
    // copy link to clipboard
    copyToClipboard()
  }

  const variants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.2,
      },
    },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  }

  return (
    <div>
      <AnimatePresence>
        {open && (
          <motion.div
            key='optionsDropdown'
            initial='inital'
            animate='animate'
            exit='exit'
            variants={variants}
            onMouseLeave={handleMouseLeave}
            className='absolute right-0 z-40 w-48 py-2 text-sm capitalize transition-colors duration-300 ease-in-out border rounded-sm shadow-xl bg-themeBg'
          >
            {project && admin && (
              <Select
                onClick={handleClick}
                data-modal='current'
                text='text-themeAccent'
              >
                <IconMenuItemWrapper>
                  <ProjectIcon />
                </IconMenuItemWrapper>
                <span className='uppercase'>{project.title}</span>
              </Select>
            )}
            {!admin && (
              <div className='flex items-center px-4 py-2 uppercase text-themeAccent'>
                {project.title}
              </div>
            )}

            {admin && project && (
              <Select onClick={handleShareProject}>
                <IconMenuItemWrapper>
                  <ShareIcon />
                </IconMenuItemWrapper>
                Share Project
              </Select>
            )}

            {admin && (
              <Select
                onClick={handleClick}
                data-modal='create'
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
              <Select onClick={handleClick} data-modal='projects'>
                <IconMenuItemWrapper>
                  <ProjectsIcon />
                </IconMenuItemWrapper>
                projects
              </Select>
            )}

            <Select onClick={handleClick} data-modal='settings'>
              <IconMenuItemWrapper>
                <SettingsIcon />
              </IconMenuItemWrapper>
              settings
            </Select>

            {admin && (
              <Select onClick={handleClick} data-modal='user'>
                <IconMenuItemWrapper>
                  <AccountIcon />
                </IconMenuItemWrapper>
                account
              </Select>
            )}
            {admin && (
              <Link href='/hello' passHref>
                <a>
                  <Select onClick={handleSignOutClick}>
                    <IconMenuItemWrapper>
                      <SignoutIcon />
                    </IconMenuItemWrapper>
                    Sign Out
                  </Select>
                </a>
              </Link>
            )}

            <Select onClick={handleThemeToggleClick}>
              <IconMenuItemWrapper>
                <ThemeToggle />
              </IconMenuItemWrapper>
              Theme
            </Select>

            <Select onClick={handleClick} data-modal='help'>
              <IconMenuItemWrapper>
                <HelpIcon />
              </IconMenuItemWrapper>
              Help
            </Select>

            <Select onClick={handleClick} data-modal='about'>
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

export default Menu
