export default function ListItem({
  message,
  person = null,
  time,
  done = false,
}) {
  return (
    <tr className='relative py-1 text-xs transform scale-100 bg-white border-b-2 cursor-default border-themeText-100'>
      <td className='pl-5 pr-3'>
        {time && (
          <div className={`${done && 'line-through'} text-gray-400`}>
            {time}
          </div>
        )}
      </td>

      <td className='px-2 py-2'>
        {person && (
          <div className='font-medium leading-5 text-gray-500 capitalize'>
            {person}
          </div>
        )}
        <div className='leading-5 text-gray-800'>{message}</div>
      </td>
    </tr>
  )
}
