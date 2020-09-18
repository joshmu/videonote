import { useState } from 'react'
import ListItem from './ListItem'
import { GoChevronRight as ArrowIcon } from 'react-icons/go'
// @ts-ignore
import style from './list.module.scss'

const data = [
  {
    message: 'I cannot stop.',
    person: 'josh mu',
    time: '05:30',
    done: false,
  },
  {
    message: 'what you gonna do about it, not sure how this can work',
    time: '12:30',
    done: true,
  },
  {
    message: 'hello from the other side',
    person: 'josh mu',
    time: '02:30',
    done: false,
  },
]

export default function List() {
  const [open, setOpen] = useState(true)

  const handleToggle = toOpen => {
    setOpen(!open)
  }

  return (
    <div
      className={`${
        open ? 'w-1/3 sm:w-1/4' : 'w-0'
      } relative transition-all duration-500 ease-in-out flex flex-col h-auto`}
    >
      <div className='relative flex items-center text-highlight-700'>
        <div
          onClick={handleToggle}
          className={`${
            open ? 'rotate-0' : 'rotate-180 -translate-x-full'
          } relative transform transition-all hover:text-highlight-400 duration-300 ease-in-out cursor-pointer`}
        >
          <ArrowIcon className='text-3xl fill-current' />
        </div>
        <h1 className='tracking-widest uppercase '>videonote</h1>
      </div>
      <div className={`${style.scrollbar} w-full h-full overflow-auto shadow `}>
        <table className='w-full bg-white'>
          <tbody className=''>
            {data.map((item, idx) => (
              <ListItem {...item} key={idx} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
