import Layout from '../src/components/Layout'
import { useThemeContext } from '../src/context/themeContext'
import NavBtn from '../src/components/shared/NavBtn'
import { Heading, Text } from '../src/components/shared/Text'
import Compressor from '../src/components/shared/Compressor'

export default function Home() {
  const { toggleTheme } = useThemeContext()

  const handleClick = () => {
    toggleTheme()
  }

  return (
    <Layout>
      <div className='absolute top-0 flex w-full h-full'>
        <div className='flex items-center justify-end w-full h-full bg-themeHighlight'>
          <Heading className='text-8xl'>Video</Heading>
          <NavBtn
            href='/login'
            className='absolute -mb-32 transform -rotate-90 translate-x-1/2 bottom-1/2'
          >
            Let's Go
          </NavBtn>
        </div>
        <div className='flex items-center justify-start w-full h-full bg-themeDark'>
          <Heading className='text-themeHighlight text-8xl'>Note</Heading>
        </div>
      </div>
    </Layout>
  )
}
