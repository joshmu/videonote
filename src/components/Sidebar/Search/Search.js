import { useVideoContext } from '@/context/videoContext'
import { useTodoContext } from '@/context/todoContext'
import { useEffect } from 'react'

export default function Search() {
  const { search, updateSearch } = useTodoContext()
  const { toggleSmartControls } = useVideoContext()

  useEffect(() => {
    const cmd = search.length === 0
    toggleSmartControls(cmd)
  }, [search])

  const handleChange = e => {
    const value = e.target.value
    // disable empty space for start of search
    updateSearch(value === ' ' ? '' : value)
  }

  return (
    <input
      className='w-full transition-colors duration-300 ease-in-out bg-transparent placeholder-themeText2 focus:outline-none fo5us:outline-none text-temeText'
      type='text'
      placeholder='Search'
      value={search}
      onChange={handleChange}
    />
  )
}
