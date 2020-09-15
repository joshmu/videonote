import Link from 'next/link'

export default function NavBtn({
  href = '/',
  children,
  className = '',
  ...props
}) {
  return (
    <Link href={href} {...props}>
      <span
        className={`${className} px-3 py-2 tracking-wider uppercase transition-colors duration-300 ease-in-out cursor-pointer bg-themeText text-themeHighlight hover:text-themeText hover:bg-themeHighlight`}
      >
        {children}
      </span>
    </Link>
  )
}
