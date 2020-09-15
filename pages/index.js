import Layout from '../src/components/Layout'
import { useThemeContext } from '../src/context/themeContext'
import NavBtn from '../src/components/shared/NavBtn'
import { Heading } from '../src/components/shared/Text'
import ThemeToggle from '../src/components/ThemeToggle'

export default function Home() {
  const { toggleTheme } = useThemeContext()

  const handleClick = () => {
    toggleTheme()
  }

  return (
    <Layout>
      <ThemeToggle
        lightColor='text-themeHighlight'
        darkColor='text-themeHighlight'
      />
      <div className='absolute top-0 flex w-full h-full'>
        <div className='flex items-center justify-end w-full h-full bg-themeHighlight'>
          <Heading
            onClick={handleClick}
            className='cursor-pointer text-8xl text-themeBackground'
          >
            Video
          </Heading>
          <NavBtn
            href='/login'
            className='absolute -mb-32 transform -rotate-90 translate-x-1/2 bottom-1/2 bg-themeBackground hover:text-themeBackground'
          >
            Let's Go
          </NavBtn>
        </div>
        <div className='flex items-center justify-start w-full h-full transition-colors duration-300 ease-in-out bg-themeBackground'>
          <Heading
            onClick={handleClick}
            className='cursor-pointer text-themeHighlight text-8xl'
          >
            Note
          </Heading>
        </div>
      </div>
    </Layout>
  )
}
