/**
 * @path /src/components/Sidebar/SidebarHeader/SidebarHeader.tsx
 *
 * @project videonote
 * @file SidebarHeader.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 12th October 2020
 * @modified Tuesday, 1st December 2020 11:46:30 am
 * @copyright © 2020 - 2020 MU
 */

import React from 'react'

import { useGlobalContext } from '@/context/globalContext'

import { Menu } from './Menu/Menu'
import { Search } from './Search/Search'
import { SidebarOpenIcon } from './SidebarOpenIcon/SidebarOpenIcon'
import { MenuButton } from './Menu/MenuButton/MenuButton'

export const SidebarHeader = () => {
  const { sidebarOpen, toggleSidebar, projects } = useGlobalContext()

  const toggleOpen = (): void => {
    toggleSidebar()
  }

  const projectsExist = projects.length > 0

  return (
    <div
      className={`${
        projectsExist ? 'border-b' : ''
      } bg-themeBg relative flex items-center justify-between transition-colors duration-300 ease-in-out border-themeText2`}
    >
      <div className='flex items-center w-full h-10'>
        <SidebarOpenIcon
          isVisible={projectsExist}
          toggleOpen={toggleOpen}
          sidebarOpen={sidebarOpen}
        />

        <Search />
      </div>

      {/* menu dropdown*/}
      <div className='relative px-2 transition-colors duration-300 ease-in-out cursor-pointer text-themeAccent2 hover:text-themeAccent disable-select'>
        <MenuButton drawAttention={projectsExist} />

        <Menu />
      </div>
    </div>
  )
}
