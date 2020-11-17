import { motion } from 'framer-motion'
import React from 'react'
import { GoChevronRight as ArrowIcon } from 'react-icons/go'
import { MdSettings as MenuIcon } from 'react-icons/md'

import { useGlobalContext } from '@/context/globalContext'

import Menu from '../Menu/Menu'
import Search from '../Search/Search'

const SidebarHeader = () => {
  const {
    toggleMenuOpen,
    menuOpen,
    sidebarOpen,
    toggleSidebar,
    projects,
  } = useGlobalContext()

  const toggleOpen = () => {
    toggleSidebar()
  }

  const handleSettingsClick = () => {
    toggleMenuOpen()
  }

  return (
    <div
      className={`${
        projects.length > 0 ? 'border-b' : ''
      } relative flex items-center justify-between transition-colors duration-300 ease-in-out border-themeText2`}
    >
      <div className='flex items-center w-full h-10'>
        {/* arrow slider icon */}
        {projects.length > 0 && (
          <div
            onClick={toggleOpen}
            className={`${
              sidebarOpen ? 'rotate-0' : 'rotate-180 -translate-x-full'
            } relative text-4xl mr-2 transform text-themeAccent2 z-10 bg-transparent transition-all hover:text-themeAccent duration-500 ease-in-out cursor-pointer`}
          >
            <ArrowIcon className='fill-current' />
          </div>
        )}

        <Search />
      </div>

      {/* menu dropdown*/}
      <div className='relative px-2 transition-colors duration-300 ease-in-out cursor-pointer text-themeAccent2 hover:text-themeAccent disable-select'>
        <motion.div
          whileHover={{ rotate: 90 }}
          className={
            projects.length === 0 ? 'animate-pulse text-themeAccent' : ''
          }
        >
          <MenuIcon
            onClick={handleSettingsClick}
            className='text-2xl fill-current'
          />
        </motion.div>

        <Menu open={menuOpen} />
      </div>
    </div>
  )
}

export default SidebarHeader
