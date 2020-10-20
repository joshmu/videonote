export default function Select({
  children,
  modalId = null,
  padding = 'px-4 py-2',
  animate = '',
  text = 'text-themeText',
  ...props
}) {
  return (
    <div
      data-modal={modalId}
      className={`${padding} ${animate} flex items-center cursor-pointer ${text} hover:bg-themeSelect hover:text-white`}
      {...props}
    >
      {children}
    </div>
  )
}
