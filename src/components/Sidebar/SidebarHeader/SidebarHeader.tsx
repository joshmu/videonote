/**
 * @path /src/components/Sidebar/SidebarHeader/SidebarHeader.tsx
 *
 * @project videonote
 * @file SidebarHeader.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 12th October 2020
 * @modified Tuesday, 1st December 2020 12:18:16 pm
 * @copyright © 2020 - 2020 MU
 */

import React from 'react'

import { useGlobalContext } from '@/context/globalContext'

import { Menu } from './Menu/Menu'
import { Search } from './Search/Search'
import { SidebarOpenIcon } from './SidebarOpenIcon/SidebarOpenIcon'
import { MenuButton } from './Menu/MenuButton/MenuButton'
import { useNoteContext } from '@/root/src/context/noteContext'
import { SidebarTitle } from './SidebarTitle/SidebarTitle'

export const SidebarHeader = () => {
  const { sidebarOpen, toggleSidebar, projects, project } = useGlobalContext()
  const { notes } = useNoteContext()

  const toggleOpen = (): void => {
    toggleSidebar()
  }

  const notesExist: boolean = notes.length > 0
  const projectsExist: boolean = projects.length > 0

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
            {project?.title ? project.title : 'VideoNote'}
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
