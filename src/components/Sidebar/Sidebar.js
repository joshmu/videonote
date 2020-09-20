import { useState } from 'react'
import { GoChevronRight as ArrowIcon } from 'react-icons/go'
import { MdSettings as SettingsIcon } from 'react-icons/md'
import { useGlobalContext } from '../../context/globalContext'
import Search from '../shared/Search'
import TodoList from '../TodoList/TodoList'
import SettingsDropdown from '../SettingsDropdown/SettingsDropdown'

export default function Sidebar(props) {
  const { toggleSettingsOpen, settingsOpen } = useGlobalContext()
  const [open, setOpen] = useState(true)

  const toggleOpen = () => {
    setOpen(!open)
  }

  const handleSettingsClick = () => {
    toggleSettingsOpen()
  }

  return (
    <div
      className={`${
        open ? 'w-1/3' : 'w-0'
      } relative flex flex-col h-auto transition-all duration-500 ease-in-out`}
      {...props}
    >
      {/* sidebar header */}
      <div className='relative flex items-center justify-between border-b border-black'>
        <div className='flex items-center h-10'>
          <div
            onClick={toggleOpen}
            className={`${
              open ? 'rotate-0' : 'rotate-180 -translate-x-full'
            } relative text-3xl mr-2 transform text-highlight-700 z-10 bg-transparent transition-all hover:text-highlight-400 duration-500 ease-in-out cursor-pointer`}
          >
            <ArrowIcon className='fill-current' />
          </div>
          <Search />
        </div>
        <div className='relative mr-2 text-gray-600 transition-colors duration-300 ease-in-out cursor-pointer hover:text-themeHighlight'>
          <SettingsIcon
            onClick={handleSettingsClick}
            className='text-xl fill-current'
          />

          <SettingsDropdown open={settingsOpen} />
        </div>
      </div>

      {/* sidebar content */}
      <div className='w-full h-full overflow-auto shadow scrollbar'>
        <TodoList />
      </div>
    </div>
  )
}
