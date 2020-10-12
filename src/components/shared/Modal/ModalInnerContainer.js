const ModalInnerContainer = ({ children }) => {
  return (
    <div className='overflow-y-scroll max-h-80vh scrollbar'>{children}</div>
  )
}

export default ModalInnerContainer
