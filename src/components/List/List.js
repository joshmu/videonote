import ListItem from './ListItem'
// @ts-ignore
import style from './list.module.scss'

export default function List() {
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
  return (
    <div className='flex flex-col w-1/3 h-auto sm:w-1/4'>
      <div className={`${style.scrollbar} w-full h-full overflow-auto shadow`}>
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
