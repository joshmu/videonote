import { useEffect } from 'react'

import { useTodoContext } from '@/context/todoContext'
import { useVideoContext } from '@/context/videoContext'

export default function Search() {
  const { search, updateSearch, todos } = useTodoContext()
  const { toggleSmartControls } = useVideoContext()

  // enable smart controls when search box is empty
  useEffect(() => {
    const enableSmartControls = search.length === 0
    toggleSmartControls(enableSmartControls)
  }, [search])

  const handleChange = e => {
    const value = e.target.value
    // disable empty space for start of search
    updateSearch(value === ' ' ? '' : value)
  }

  return (
    todos.length > 0 && (
      <input
        className='w-full transition-colors duration-300 ease-in-out bg-transparent placeholder-themeText2 focus:outline-none fo5us:outline-none text-temeText'
        type='text'
        placeholder='Search'
        value={search}
        onChange={handleChange}
      />
    )
  )
}
