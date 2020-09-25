import { useVideoContext } from '../../context/videoContext'
import { useTodoContext } from '../../context/todoContext'

export default function Search() {
  const { search, updateSearch } = useTodoContext()
  const { smartControls } = useVideoContext()

  const handleChange = e => {
    const value = e.target.value
    // disable empty space for start of search
    updateSearch(value === ' ' ? '' : value)
  }

  const handleKeyDown = e => {
    // keyboard logic on empty field
    if (e.target.value === '') {
      smartControls(e.key)
    }
  }

  return (
    <input
      className='w-full transition-colors duration-300 ease-in-out bg-transparent placeholder-themeText2 focus:outline-none fo5us:outline-none text-temeText'
      type='text'
      placeholder='Search'
      value={search}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  )
}
