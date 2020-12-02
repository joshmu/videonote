/**
 * @path /src/components/Sidebar/SidebarHeader/SidebarHeader.tsx
 *
 * @project videonote
 * @file SidebarHeader.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 12th October 2020
 * @modified Wednesday, 2nd December 2020 3:44:55 pm
 * @copyright © 2020 - 2020 MU
 */

import React from 'react'

import { useGlobalContext } from '@/context/globalContext'
import { useNoteContext } from '@/root/src/context/noteContext'

import { Menu } from './Menu/Menu'
import { MenuButton } from './Menu/MenuButton/MenuButton'
import { Search } from './Search/Search'
import { SidebarOpenIcon } from './SidebarOpenIcon/SidebarOpenIcon'
import { SidebarTitle } from './SidebarTitle/SidebarTitle'

export const SidebarHeader = () => {
  const {
    sidebarOpen,
    toggleSidebar,
    projectsExist,
    project,
  } = useGlobalContext()
  const { notesExist } = useNoteContext()

  const toggleOpen = (): void => {
    toggleSidebar()
  }

  return (
    <div
      className={`${
        projectsExist ? 'border-b' : ''
      } bg-themeBg relative flex items-center h-10 justify-between transition-colors duration-300 ease-in-out border-themeText2`}
    >
      {/* inner content area */}
      <div className='flex items-center w-full h-full'>
        <SidebarOpenIcon
          isVisible={projectsExist}
          toggleOpen={toggleOpen}
          sidebarOpen={sidebarOpen}
        />

        {notesExist ? (
          <Search />
        ) : (
          <SidebarTitle>
            {project?.title ? project.title.toUpperCase() : 'VideoNote'}
          </SidebarTitle>
        )}
      </div>

      {/* menu dropdown*/}
      <div className='relative px-2 transition-colors duration-300 ease-in-out cursor-pointer text-themeAccent2 hover:text-themeAccent disable-select'>
        <MenuButton drawAttention={projectsExist} />

        <Menu />
      </div>
    </div>
  )
}
