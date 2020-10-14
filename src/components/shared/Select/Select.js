export default function Select({
  children,
  padding = 'px-4 py-2',
  animate = '',
  ...props
}) {
  return (
    <div
      className={`${padding} ${animate} flex items-center cursor-pointer text-themeText hover:bg-blue-800 hover:text-white`}
      {...props}
    >
      {children}
    </div>
  )
}
