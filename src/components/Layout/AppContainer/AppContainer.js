const AppContainer = ({ children, ...props }) => {
  return (
    <div className='flex flex-1 w-full h-full' {...props}>
      {children}
    </div>
  )
}

export default AppContainer
