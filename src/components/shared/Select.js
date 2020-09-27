export default function Select({ children, ...props }) {
  return (
    <div
      className='block px-4 py-2 cursor-pointer text-themeText hover:bg-blue-500 hover:text-white'
      {...props}
    >
      {children}
    </div>
  )
}
