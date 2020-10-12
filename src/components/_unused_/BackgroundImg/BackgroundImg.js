const BackgroundImg = ({
  src = null,
  style = {},
  className = {},
  ...props
}) => {
  const bgImageSrc = src ? { backgroundImage: `url(${src})` } : {}

  return (
    <div
      className={`${className} absolute top-0 bottom-0 left-0 right-0 w-full h-full z-0 pointer-events-none`}
      style={{
        ...bgImageSrc,
        ...style,
        backgroundSize: '100%',
        backgroundRepeat: 'no-repeat',
      }}
      {...props}
    ></div>
  )
}

export default BackgroundImg
