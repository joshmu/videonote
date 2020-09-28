import {
  FiCircle as CircleIcon,
  FiCheckCircle as CheckIcon,
} from 'react-icons/fi'

export const Toggle = ({ state, onClick }) => {
  return (
    <div onClick={onClick} className='cursor-pointer'>
      {state ? <CheckIcon /> : <CircleIcon />}
    </div>
  )
}

export const ToggleInput = ({ title, state, onClick }) => {
  return (
    <div className='flex items-center gap-2'>
      <Toggle state={state} onClick={onClick} />
      <p>{title}</p>
    </div>
  )
}
