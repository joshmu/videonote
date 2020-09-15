export function Heading(props) {
  return (
    <h1
      className='mt-0 mb-2 text-6xl font-normal leading-normal tracking-tight'
      {...props}
    ></h1>
  )
}

export function SubHeading(props) {
  return (
    <h2
      className='mt-0 mb-2 text-2xl font-normal leading-normal tracking-tight'
      {...props}
    ></h2>
  )
}

export function Text(props) {
  return (
    <p
      className='mt-0 mb-4 text-base leading-relaxed text-gray-800'
      {...props}
    ></p>
  )
}
