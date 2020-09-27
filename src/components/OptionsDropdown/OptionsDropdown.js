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
        <div className='absolute right-0 z-20 w-48 py-2 text-sm capitalize transition-colors duration-300 ease-in-out border rounded-sm shadow-xl bg-themeBg'>
          <Select onClick={handleClick} data-modal='create'>
            create
          </Select>
          <Select onClick={handleClick} data-modal='projects'>
            projects
          </Select>
          <Select onClick={handleClick} data-modal='settings'>
            settings
          </Select>
          <Select onClick={handleClick} data-modal='account'>
            account
          </Select>
          <Link href='/'>
            <Select onClick={handleSignOutClick}>Sign Out</Select>
          </Link>
          <Select onClick={handleThemeToggleClick}>
            <div className='relative flex text-md'>
              <ThemeToggle
                darkColor='text-themeText'
                lightColor='text-themeText'
              />
            </div>
          </Select>
        </div>
      )}
    </div>
  )
}
