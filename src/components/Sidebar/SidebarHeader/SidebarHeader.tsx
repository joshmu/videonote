/**
 * @path /src/components/Sidebar/SidebarHeader/SidebarHeader.tsx
 *
 * @project videonote
 * @file SidebarHeader.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 12th October 2020
 * @modified Tuesday, 1st December 2020 11:04:03 am
 * @copyright © 2020 - 2020 MU
 */

import { motion } from 'framer-motion'
import React from 'react'
import { GoChevronRight as ArrowIcon } from 'react-icons/go'
import { MdSettings as MenuIcon } from 'react-icons/md'

import { useGlobalContext } from '@/context/globalContext'

import { Menu } from './Menu/Menu'
import { Search } from './Search/Search'

export const SidebarHeader = () => {
  const {
    toggleMenuOpen,
    menuOpen,
    sidebarOpen,
    toggleSidebar,
    projects,
  } = useGlobalContext()

  const toggleOpen = (): void => {
    toggleSidebar()
  }

  const handleSettingsClick = (): void => {
    toggleMenuOpen()
  }

  const projectsExist = () => projects.length > 0

  return (
    <div
      className={`${
        projectsExist() ? 'border-b' : ''
      } bg-themeBg relative flex items-center justify-between transition-colors duration-300 ease-in-out border-themeText2`}
    >
      <div className='flex items-center w-full h-10'>
        {/* arrow slider icon */}
        {projectsExist() && (
          <div
            onClick={toggleOpen}
            className={`relative z-10 mr-2 transition-all duration-200 ease-in-out cursor-pointer text-themeAccent2 hover:text-themeAccent ${
              sidebarOpen ? '' : 'rotate-180 -translate-x-full transform'
            }`}
          >
            <ArrowIcon className='text-4xl' />
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
          <MenuIcon onClick={handleSettingsClick} className='text-2xl' />
        </motion.div>

        <Menu open={menuOpen} />
      </div>
    </div>
  )
}
