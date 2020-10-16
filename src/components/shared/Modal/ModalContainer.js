import CloseModalBtn from './CloseModalBtn'

const ModalContainer = ({
  toggle,
  children,
  motionKey = 'modal',
  zIndex = null,
  ...props
}) => {
  return (
    <div
      className={`${
        zIndex ? zIndex : 'z-30'
      } absolute w-full max-w-lg transform -translate-x-1/2 -translate-y-1/2 max-h-11/12 top-1/2 left-1/2`}
      {...props}
    >
      <div className='relative w-full p-6 mx-auto border rounded-sm shadow-md border-themeText bg-themeBg'>
        <CloseModalBtn toggle={toggle} />
        {children}
      </div>
    </div>
  )
}

export default ModalContainer
