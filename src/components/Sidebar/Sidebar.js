import { useState, useEffect } from 'react'
import { GoChevronRight as ArrowIcon } from 'react-icons/go'
import { MdSettings as SettingsIcon } from 'react-icons/md'
import { useGlobalContext } from '../../context/globalContext'
import Search from '../shared/Search'
import TodoList from '../TodoList/TodoList'
import SettingsDropdown from '../SettingsDropdown/SettingsDropdown'
// import { useTodoContext } from '../../context/todoContext'
import { useResizable } from '../../hooks/useResizable'

export default function Sidebar(props) {
  const {
    toggleSettingsOpen,
    settingsOpen,
    settings,
    updateSettings,
  } = useGlobalContext()
  // const { sidebar, sidebarResizeStart } = useTodoContext()
  const { state: resizeState, handleStartResize } = useResizable({
    initialSize: settings.sidebarWidth,
  })
  const [open, setOpen] = useState(true)

  // update sidebar width once resizing completes
  useEffect(() => {
    if (!resizeState.resizing) {
      console.log('updating sidebar width', { resizeState })
      updateSettings({ sidebarWidth: resizeState.size })
    }
  }, [resizeState.resizing])

  const toggleOpen = () => {
    setOpen(!open)
  }

  const handleSettingsClick = () => {
    toggleSettingsOpen()
  }

  return (
    <div
      id='sidebar'
      style={{
        width: open ? resizeState.size + 'px' : '0px',
      }}
      className='relative flex flex-col h-auto transition-all duration-500 ease-in-out border-l border-gray-300 '
      {...props}
    >
      {/* sidebar edge for resizing */}
      <div
        className='absolute left-0 w-4 h-full transform -translate-x-1/2'
        style={{ cursor: 'ew-resize' }}
        onMouseDown={handleStartResize}
      ></div>

      {/* sidebar inner wrapper to maintain width */}
      <div
        style={{ width: resizeState.size + 'px' }}
        className='relative h-full'
      >
        {/* sidebar header */}
        <div className='relative flex items-center justify-between border-b border-gray-500'>
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
        <div className='w-full h-full overflow-auto scrollbar'>
          <TodoList />
        </div>
      </div>
    </div>
  )
}
