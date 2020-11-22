/**
 * @path /src/components/Sidebar/SidebarHeader/SidebarHeader.tsx
 *
 * @project videonote
 * @file SidebarHeader.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 12th October 2020
 * @modified Sunday, 22nd November 2020 2:02:55 pm
 * @copyright © 2020 - 2020 MU
 */

import { motion } from 'framer-motion'
import React from 'react'
import { GoChevronRight as ArrowIcon } from 'react-icons/go'
import { MdSettings as MenuIcon } from 'react-icons/md'

import { useGlobalContext } from '@/context/globalContext'

import Menu from '../Menu/Menu'
import Search from '../Search/Search'

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
            className={`relative text-4xl mr-2 text-themeAccent2 z-10 transition-all hover:text-themeAccent duration-200 ease-in-out cursor-pointer`}
          >
            <motion.div
              onClick={toggleOpen}
              style={{
                rotate: sidebarOpen ? 0 : 180,
                translateX: sidebarOpen ? 0 : '-100%',
              }}
              transition={{ duration: 0.5 }}
            >
              <ArrowIcon className='fill-current' />
            </motion.div>
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
