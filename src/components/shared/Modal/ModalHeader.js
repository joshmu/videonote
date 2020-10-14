const ModalHeader = ({ children }) => {
  return (
    <div className='mb-6 -ml-12'>
      <div className='w-4/5 py-2 text-themeBg bg-themeAccent'>
        <span className='pl-8 text-lg font-semibold uppercase'>{children}</span>
      </div>
    </div>
  )
}

export default ModalHeader
