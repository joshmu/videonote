import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import Cookie from 'universal-cookie'
import { MdAdd as CreateIcon } from 'react-icons/md'
import { VscSettings as SettingsIcon } from 'react-icons/vsc'
import {
  RiUserSettingsLine as AccountIcon,
  RiLogoutBoxLine as SignoutIcon,
  RiLightbulbFlashLine as AboutIcon,
} from 'react-icons/ri'
import { IoIosHelpCircleOutline as HelpIcon } from 'react-icons/io'

import {
  AiOutlineUnorderedList as ProjectsIcon,
  AiOutlineShareAlt as ShareIcon,
  AiOutlineFile as ProjectIcon,
} from 'react-icons/ai'

import Select from '@/components/shared/Select/Select'
import ThemeToggle from '@/components/shared/ThemeToggle/ThemeToggle'
import { useGlobalContext } from '@/context/globalContext'
import { useThemeContext } from '@/context/themeContext'

const OptionsDropdown = ({ open }) => {
  const {
    toggleSettingsOpen,
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
    toggleSettingsOpen()
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
    toggleSettingsOpen(false)
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
                <IconMenuWrapper>
                  <ProjectIcon />
                </IconMenuWrapper>
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
                <IconMenuWrapper>
                  <ShareIcon />
                </IconMenuWrapper>
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
                <IconMenuWrapper>
                  <CreateIcon />
                </IconMenuWrapper>
                create new
              </Select>
            )}

            {admin && projects.length > 0 && (
              <Select onClick={handleClick} data-modal='projects'>
                <IconMenuWrapper>
                  <ProjectsIcon />
                </IconMenuWrapper>
                projects
              </Select>
            )}

            <Select onClick={handleClick} data-modal='settings'>
              <IconMenuWrapper>
                <SettingsIcon />
              </IconMenuWrapper>
              settings
            </Select>

            {admin && (
              <Select onClick={handleClick} data-modal='user'>
                <IconMenuWrapper>
                  <AccountIcon />
                </IconMenuWrapper>
                account
              </Select>
            )}
            {admin && (
              <Link href='/hello' passHref>
                <a>
                  <Select onClick={handleSignOutClick}>
                    <IconMenuWrapper>
                      <SignoutIcon />
                    </IconMenuWrapper>
                    Sign Out
                  </Select>
                </a>
              </Link>
            )}

            <Select onClick={handleThemeToggleClick}>
              <IconMenuWrapper>
                <ThemeToggle />
              </IconMenuWrapper>
              Theme
            </Select>

            <Select onClick={handleClick} data-modal='help'>
              <IconMenuWrapper>
                <HelpIcon />
              </IconMenuWrapper>
              Help
            </Select>

            <Select onClick={handleClick} data-modal='about'>
              <IconMenuWrapper>
                <AboutIcon />
              </IconMenuWrapper>
              About VideoNote
            </Select>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const IconMenuWrapper = ({ children }) => (
  <div className='relative flex items-center w-6 h-full mb-px'>{children}</div>
)

export default OptionsDropdown
