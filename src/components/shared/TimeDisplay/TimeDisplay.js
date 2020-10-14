export default function TimeDisplay({ seconds = 0, lock = false }) {
  return (
    <div className={`${lock ? 'text-themeAccent2' : ''}`}>
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
