import Link from 'next/link'
import { useGlobalContext } from '../../context/globalContext'

export default function SettingsDropdown({ open, ...props }) {
  const {
    toggleSettingsOpen,
    toggleModalOpen,
    resetGlobalState,
  } = useGlobalContext()

  const handleClick = e => {
    const modalId = e.target.getAttribute('data-modal')
    toggleModalOpen(modalId)
    toggleSettingsOpen()
  }

  const handleSignOutClick = () => {
    toggleSettingsOpen()
    resetGlobalState()
  }

  return (
    <div {...props}>
      {open && (
        <div className='absolute right-0 z-20 w-48 py-2 bg-white border rounded-sm shadow-xl'>
          <p
            onClick={handleClick}
            data-modal='create'
            className='block px-4 py-2 text-sm text-gray-700 capitalize hover:bg-blue-500 hover:text-white'
          >
            create project
          </p>
          <p
            onClick={handleClick}
            data-modal='project'
            className='block px-4 py-2 text-sm text-gray-700 capitalize hover:bg-blue-500 hover:text-white'
          >
            project settings
          </p>
          <p
            onClick={handleClick}
            data-modal='account'
            className='block px-4 py-2 text-sm text-gray-700 capitalize hover:bg-blue-500 hover:text-white'
          >
            account
          </p>
          <Link href='/'>
            <p
              onClick={handleSignOutClick}
              className='block px-4 py-2 text-sm text-gray-700 capitalize hover:bg-blue-500 hover:text-white'
            >
              Sign Out
            </p>
          </Link>
        </div>
      )}
    </div>
  )
}
