/**
 * @path /src/components/Sidebar/SidebarHeader/Search/Search.tsx
 *
 * @project videonote
 * @file Search.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Saturday, 19th September 2020
 * @modified Monday, 30th November 2020 7:54:25 pm
 * @copyright © 2020 - 2020 MU
 */

import { ChangeEvent, useEffect } from 'react'

import { useControlsContext } from '@/context/controlsContext'
import { useGlobalContext } from '@/context/globalContext'
import { useNoteContext } from '@/context/noteContext'

export const Search = () => {
  const { project } = useGlobalContext()
  const { search, updateSearch, notes } = useNoteContext()
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
    notes.length > 0 && (
      <input
        className='w-full transition-colors duration-300 ease-in-out bg-transparent placeholder-themeText2 focus:outline-none fo5us:outline-none text-temeText'
        type='text'
        placeholder={`Search - ${project.title}`}
        value={search}
        onChange={handleChange}
      />
    )
  )
}
