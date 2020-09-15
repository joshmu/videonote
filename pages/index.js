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
      <Heading onClick={handleClick}>
        <span className='font-semibold text-themeHighlight'>V</span>
        ideo
        <span className='font-semibold text-themeHighlight'>N</span>
        ote
      </Heading>
      <Text>Here is some text.</Text>
      <NavBtn href='/login'>Let's login</NavBtn>
    </Layout>
  )
}
