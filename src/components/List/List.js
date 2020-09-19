import { useState } from 'react'
import { GoChevronRight as ArrowIcon } from 'react-icons/go'
import { MdSettings as SettingsIcon } from 'react-icons/md'
import ListItem from './ListItem'
// @ts-ignore
import style from './list.module.scss'
import { useGlobalContext } from '../../context/globalContext'
import Search from '../shared/Search'

export default function List() {
  const [listOpen, setListOpen] = useState(true)

  const { todos, listSort } = useGlobalContext()

  const toggleListOpen = () => {
    setListOpen(!listOpen)
  }

  const handleSettingsClick = () => {
    window.alert('settings')
  }

  return (
    <div
      className={`${
        listOpen ? 'w-1/3' : 'w-0'
      } relative flex flex-col h-auto transition-all duration-500 ease-in-out`}
    >
      {/* list header */}
      <div className='relative flex items-center justify-between border-b border-black'>
        <div className='flex'>
          <div
            onClick={toggleListOpen}
            className={`${
              listOpen ? 'rotate-0' : 'rotate-180 -translate-x-full'
            } relative text-3xl mr-2 transform text-highlight-700 z-50 bg-transparent transition-all hover:text-highlight-400 duration-500 ease-in-out cursor-pointer`}
          >
            <ArrowIcon className='fill-current' />
          </div>
          {/* <h1 className='tracking-widest uppercase text-highlight-700'>
          videonote
        </h1> */}
          <Search />
        </div>
        <div
          onClick={handleSettingsClick}
          className='mr-2 text-gray-600 transition-colors duration-300 ease-in-out cursor-pointer hover:text-themeHighlight'
        >
          <SettingsIcon className='text-xl fill-current' />
        </div>
      </div>

      {/* list content */}
      <div className={`${style.scrollbar} w-full h-full overflow-auto shadow `}>
        <table className='w-full bg-white'>
          <tbody className=''>
            {listSort(todos).map(todo => (
              <ListItem todo={todo} key={todo.id} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
