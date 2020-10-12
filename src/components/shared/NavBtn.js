import Link from 'next/link'

export default function NavBtn({
  href = '/',
  children,
  className = '',
  ...props
}) {
  return (
    <Link href={href} {...props}>
      <button
        className={`${className} px-3 py-2 tracking-wider uppercase transition-colors duration-300 ease-in-out cursor-pointer text-highlight-400 hover:text-themeText hover:bg-highlight-400`}
      >
        {children}
      </button>
    </Link>
  )
}
