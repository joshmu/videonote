import { useVideoContext } from '../../context/videoContext'

export default function progressBar({ active }) {
  const { progress } = useVideoContext()

  const perc = num => {
    return (num * 100).toFixed(3) + '%'
  }

  return (
    <div
      className={`${
        active ? 'opacity-100' : 'opacity-90'
      } relative h-1 overflow-hidden text-xs bg-transparent `}
    >
      <div
        style={{ width: perc(progress.played) }}
        className='absolute z-20 h-full bg-green-500'
      ></div>
      <div
        style={{ width: perc(progress.loaded) }}
        className='absolute z-10 h-full transition-all duration-300 ease-linear bg-highlight-200'
      ></div>
    </div>
  )
}
