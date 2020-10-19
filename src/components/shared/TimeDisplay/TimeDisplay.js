export default function TimeDisplay({
  seconds = 0,
  lock = false,
  inputActive,
}) {
  return (
    <div
      className={`${lock ? 'text-themeAccent' : ''}
      ${inputActive ? 'opacity-100' : 'opacity-50'} 
       px-2 transition-all duration-200 ease-in-out h-full flex items-center`}
    >
      {format(seconds)}
    </div>
  )
}

function format(seconds) {
  const date = new Date(seconds * 1000)
  const hh = date.getUTCHours()
  const mm = date.getUTCMinutes()
  const ss = pad(date.getUTCSeconds())
  return hh ? `${hh}:${pad(mm)}:${ss}` : `${mm}:${ss}`
}

function pad(string) {
  return ('0' + string).slice(-2)
}
