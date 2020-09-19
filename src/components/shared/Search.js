import { useGlobalContext } from '../../context/globalContext'

export default function Search() {
  const { search, handleSearch } = useGlobalContext()

  return (
    <input
      className='placeholder-gray-300 focus:outline-none'
      type='text'
      placeholder='Search'
      value={search}
      onChange={handleSearch}
    />
  )
}
