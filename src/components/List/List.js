import { useState } from 'react'
import { GoChevronRight as ArrowIcon } from 'react-icons/go'
import ListItem from './ListItem'
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
  const [listOpen, setListOpen] = useState(true)
  const toggleListOpen = () => {
    setListOpen(!listOpen)
  }

  // todo: try removing the list completely with framer motion - unmount
  // todo: research how to slide flex div out of the way
  // * continue to privledge responsiveness
  // todo: place toggle arrow back within list component rather than within player wrapper

  return (
    <div
      className={`${
        listOpen ? 'w-1/3' : 'w-0'
      } relative flex flex-col h-auto transition-all duration-500 ease-in-out`}
    >
      <div className='relative flex items-center'>
        <div
          onClick={toggleListOpen}
          className={`${
            listOpen ? 'rotate-0' : 'rotate-180 -translate-x-full'
          } relative text-3xl transform text-highlight-700 z-50 bg-transparent transition-all hover:text-highlight-400 duration-500 ease-in-out cursor-pointer`}
        >
          <ArrowIcon className='fill-current' />
        </div>
        <h1 className='tracking-widest uppercase text-highlight-700'>
          videonote
        </h1>
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
