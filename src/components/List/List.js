import ListItem from './ListItem'
// @ts-ignore
import style from './listStyle.module.scss'

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
    <div className='container flex justify-center h-screen py-10 mx-auto'>
      <div className='flex flex-col w-4/12 h-full pl-4'>
        <div className='px-5 py-2 text-sm font-bold text-gray-500 bg-white border-b border-gray-300 shadow'>
          VideoNote
        </div>

        <div
          className={`${style.scrollbar} w-full h-full overflow-auto bg-white shadow`}
        >
          <table className='w-full'>
            <tbody className=''>
              {data.map(item => (
                <ListItem {...item} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
