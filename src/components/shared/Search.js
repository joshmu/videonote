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
      className='w-full placeholder-gray-300 focus:outline-none'
      type='text'
      placeholder='Search'
      value={search}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  )
}
