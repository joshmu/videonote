import { useGlobalContext } from '../../context/globalContext'
import { useVideoContext } from '../../context/videoContext'

export default function Search() {
  const { search, updateSearch } = useGlobalContext()
  const { emptyInputControls } = useVideoContext()

  const handleChange = e => {
    const value = e.target.value
    // disable empty space for start of search
    updateSearch(value === ' ' ? '' : value)
  }

  const handleKeyDown = e => {
    // keyboard logic on empty field
    if (e.target.value === '') {
      emptyInputControls(e.key)
    }
  }

  return (
    <input
      className='placeholder-gray-300 focus:outline-none'
      type='text'
      placeholder='Search'
      value={search}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  )
}
