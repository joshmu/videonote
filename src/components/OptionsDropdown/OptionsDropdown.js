import Link from 'next/link'
import { useGlobalContext } from '../../context/globalContext'
import { useThemeContext } from '../../context/themeContext'
import ThemeToggle from '../ThemeToggle'

export default function OptionsDropdown({ open, ...props }) {
  const {
    toggleSettingsOpen,
    toggleModalOpen,
    resetGlobalState,
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

  return (
    <div {...props}>
      {open && (
        <div className='absolute right-0 z-20 w-48 py-2 transition-colors duration-300 ease-in-out border rounded-sm shadow-xl bg-themeBg'>
          <p
            onClick={handleClick}
            data-modal='create'
            className='block px-4 py-2 text-sm capitalize transition-colors duration-300 ease-in-out text-themeText hover:bg-blue-500 hover:text-white'
          >
            create
          </p>
          <p
            onClick={handleClick}
            data-modal='projects'
            className='block px-4 py-2 text-sm capitalize transition-colors duration-300 ease-in-out text-themeText hover:bg-blue-500 hover:text-white'
          >
            projects
          </p>
          <p
            onClick={handleClick}
            data-modal='settings'
            className='block px-4 py-2 text-sm capitalize transition-colors duration-300 ease-in-out text-themeText hover:bg-blue-500 hover:text-white'
          >
            settings
          </p>
          <p
            onClick={handleClick}
            data-modal='account'
            className='block px-4 py-2 text-sm capitalize transition-colors duration-300 ease-in-out text-themeText hover:bg-blue-500 hover:text-white'
          >
            account
          </p>
          <Link href='/'>
            <p
              onClick={handleSignOutClick}
              className='block px-4 py-2 text-sm capitalize transition-colors duration-300 ease-in-out text-themeText hover:bg-blue-500 hover:text-white'
            >
              Sign Out
            </p>
          </Link>
          <div
            onClick={handleThemeToggleClick}
            className='relative flex items-center px-4 py-2 capitalize transition-colors duration-300 ease-in-out text-themeText text-md hover:bg-blue-500 hover:text-white'
          >
            <ThemeToggle
              darkColor='text-themeText'
              lightColor='text-themeText'
            />
          </div>
        </div>
      )}
    </div>
  )
}
