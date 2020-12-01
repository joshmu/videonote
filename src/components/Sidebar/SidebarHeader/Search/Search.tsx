/**
 * @path /src/components/Sidebar/SidebarHeader/Search/Search.tsx
 *
 * @project videonote
 * @file Search.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Saturday, 19th September 2020
 * @modified Tuesday, 1st December 2020 12:16:09 pm
 * @copyright © 2020 - 2020 MU
 */

import { ChangeEvent, useEffect } from 'react'

import { useControlsContext } from '@/context/controlsContext'
import { useGlobalContext } from '@/context/globalContext'
import { useNoteContext } from '@/context/noteContext'

export const Search = () => {
  const { project } = useGlobalContext()
  const { search, updateSearch } = useNoteContext()
  const { toggleSmartControls } = useControlsContext()

  // enable smart controls when search box is empty
  useEffect(() => {
    const enableSmartControls = search.length === 0
    toggleSmartControls(enableSmartControls)
  }, [search])

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value
    // disable empty space for start of search
    updateSearch(value === ' ' ? '' : value)
  }

  return (
    <input
      className='w-full ml-2 transition-colors duration-300 ease-in-out bg-transparent text-md placeholder-themeText2 focus:outline-none text-temeText'
      type='text'
      placeholder={project?.title ? `Search - ${project.title}` : 'Search'}
      value={search}
      onChange={handleChange}
    />
  )
}
