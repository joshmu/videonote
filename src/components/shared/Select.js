export default function Select({ children, padding = 'px-4 py-2', ...props }) {
  return (
    <div
      className={`flex items-center ${padding} cursor-pointer text-themeText hover:bg-blue-800 hover:text-white`}
      {...props}
    >
      {children}
    </div>
  )
}
