import { useState, useEffect } from 'react'
import { GoChevronRight as ArrowIcon } from 'react-icons/go'
import { MdSettings as SettingsIcon } from 'react-icons/md'
import { useGlobalContext } from '../../context/globalContext'
import Search from '../shared/Search'
import TodoList from '../TodoList/TodoList'
import OptionsDropdown from '../OptionsDropdown/OptionsDropdown'
import { useResizable } from '../../hooks/useResizable'
import { motion } from 'framer-motion'

export default function Sidebar(props) {
  const {
    toggleSettingsOpen,
    settingsOpen,
    settings,
    updateSettings,
    openSidebar,
    toggleSidebar,
  } = useGlobalContext()
  const { state: resizeState, handleStartResize } = useResizable({
    initialSize: settings.sidebarWidth,
  })

  // update sidebar width once resizing completes
  useEffect(() => {
    if (!resizeState.resizing) {
      console.log('updating sidebar width', { resizeState })
      updateSettings({ sidebarWidth: resizeState.size })
    }
  }, [resizeState.resizing])

  const toggleOpen = () => {
    toggleSidebar()
  }

  const handleSettingsClick = () => {
    toggleSettingsOpen()
  }

  const sidebarVariants = {
    initial: {
      opacity: 0,
      x: '100%',
    },
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: {
      opacity: 0,
      x: '100%',
    },
  }

  return (
    <motion.div
      key='sidebar'
      initial='initial'
      animate='animate'
      exit='exit'
      variants={sidebarVariants}
      id='sidebar'
      style={{
        width: openSidebar ? resizeState.size + 'px' : '0px',
      }}
      className='relative flex flex-col h-auto transition-all duration-500 ease-in-out border-l border-themeText2'
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
        <div className='relative flex items-center justify-between transition-colors duration-300 ease-in-out border-b border-themeText2'>
          <div className='flex items-center h-10'>
            {/* arrow slider icon */}
            <div
              onClick={toggleOpen}
              className={`${
                openSidebar ? 'rotate-0' : 'rotate-180 -translate-x-full'
              } relative text-3xl mr-2 transform text-highlight-700 z-10 bg-transparent transition-all hover:text-highlight-400 duration-500 ease-in-out cursor-pointer`}
            >
              <ArrowIcon className='fill-current' />
            </div>

            <Search />
          </div>

          {/* options dropdown*/}
          <div className='relative mr-2 transition-colors duration-300 ease-in-out cursor-pointer text-highlight-700 hover:text-highlight-400'>
            <SettingsIcon
              onClick={handleSettingsClick}
              className='text-xl fill-current'
            />

            <OptionsDropdown open={settingsOpen} />
          </div>
        </div>

        {/* sidebar content */}
        <div className='w-full h-full overflow-auto scrollbar'>
          <TodoList />
        </div>
      </div>
    </motion.div>
  )
}
