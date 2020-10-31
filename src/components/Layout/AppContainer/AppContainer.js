import useTwConfig from '@/hooks/useTwConfig'

const AppContainer = ({ children, ...props }) => {
  const twConfig = useTwConfig()

  return (
    <div
      className='flex flex-1 w-full h-full bg-opacity-10'
      {...props}
      style={{
        backgroundImage: `radial-gradient(circle farthest-corner at center, ${twConfig.theme.colors.themeSelectOpacity} 0%, ${twConfig.theme.colors.themeBg} 100%)`,
      }}
    >
      {children}
    </div>
  )
}

export default AppContainer
