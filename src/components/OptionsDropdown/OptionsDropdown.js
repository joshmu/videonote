import Link from 'next/link'
import { useGlobalContext } from '../../context/globalContext'
import { useThemeContext } from '../../context/themeContext'
import Select from '../shared/Select'
import ThemeToggle from '../ThemeToggle'

export default function OptionsDropdown({ open, ...props }) {
  const {
    toggleSettingsOpen,
    toggleModalOpen,
    resetGlobalState,
    project,
  } = useGlobalContext()
  const { toggleTheme } = useThemeContext()

  const handleClick = e => {
    const modalId = e.target.getAttribute('data-modal')
    toggleModalOpen(modalId)
    toggleSettingsOpen()
  }

  const handleSignOutClick = () => {
    toggleSettingsOpen()
    resetGlobalState()
  }

  const handleThemeToggleClick = () => {
    toggleTheme()
  }

  const handleMouseLeave = () => {
    toggleSettingsOpen(false)
  }

  return (
    <div {...props}>
      {open && (
        <div
          onMouseLeave={handleMouseLeave}
          className='absolute right-0 z-40 w-48 py-2 text-sm capitalize transition-colors duration-300 ease-in-out border rounded-sm shadow-xl bg-themeBg'
        >
          {project && (
            <Select onClick={handleClick} data-modal='current'>
              <div className='text-highlight-400'>{project.title}</div>
            </Select>
          )}
          <Select onClick={handleClick} data-modal='create'>
            create
          </Select>
          <Select onClick={handleClick} data-modal='projects'>
            projects
          </Select>
          <Select onClick={handleClick} data-modal='settings'>
            settings
          </Select>
          <Select onClick={handleClick} data-modal='user'>
            account
          </Select>
          <Link href='/' passHref>
            <a>
              <Select onClick={handleSignOutClick}>Sign Out</Select>
            </a>
          </Link>
          <Select onClick={handleThemeToggleClick}>
            <div className='relative flex text-md'>
              <ThemeToggle />
            </div>
          </Select>
        </div>
      )}
    </div>
  )
}
