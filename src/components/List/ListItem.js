export default function ListItem({
  message,
  person = null,
  time,
  done = false,
}) {
  return (
    <tr className='relative py-1 text-xs transform scale-100 bg-blue-800 bg-opacity-25 border-b-2 border-blue-100 cursor-default'>
      <td className='pl-5 pr-3'>
        <div className='text-gray-400'>{done && '✔️'}</div>
        {time && <div>{time}</div>}
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
