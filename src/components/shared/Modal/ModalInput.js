const ModalInput = ({
  title = '',
  id = '',
  type = 'text',
  placeholder = '',
  ...props
}) => {
  return (
    <div>
      <label className='text-themeText' htmlFor={id}>
        {title}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className={`block w-full ${
          type === 'range' ? 'px-0' : 'px-4'
        } py-2 mt-2 border rounded-sm border-themeText2 text-themeText bg-themeBg focus:border-themeText focus:outline-none`}
        {...props}
      />
    </div>
  )
}

export default ModalInput
