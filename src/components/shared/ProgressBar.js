export default function ProgressBar() {
  return (
    <div className='relative pt-1'>
      <div className='flex h-2 mb-4 overflow-hidden text-xs rounded bg-blue-50'>
        <div
          style={{ width: '10%' }}
          className='flex flex-col justify-center text-center text-white bg-green-500 shadow-none whitespace-nowrap'
        ></div>
        <div
          style={{ width: '25%' }}
          className='flex flex-col justify-center text-center text-white whitespace-no-wrap bg-green-100 shadow-none'
        ></div>
      </div>
    </div>
  )
}
