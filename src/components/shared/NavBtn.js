import Link from 'next/link'

export default function NavBtn({ href = '/', children, ...props }) {
  return (
    <Link href={href} {...props}>
      <span className='px-2 py-1 uppercase transition-colors duration-300 ease-in-out bg-indigo-300 cursor-pointer text-themeText hover:bg-indigo-400'>
        {children}
      </span>
    </Link>
  )
}
