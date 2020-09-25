import Layout from '../src/components/Layout'
import { useThemeContext } from '../src/context/themeContext'
import NavBtn from '../src/components/shared/NavBtn'
import { Heading } from '../src/components/shared/Text'
import ThemeToggle from '../src/components/ThemeToggle'
import { motion } from 'framer-motion'
import MotionFadeUp from '../src/components/shared/MotionFadeUp'

export default function Home() {
  const { toggleTheme } = useThemeContext()

  const handleClick = () => {
    toggleTheme()
  }

  return (
    <Layout>
      <div className='absolute top-0 right-0 z-50 p-4 text-2xl hover:text-themeHighlight'>
        <ThemeToggle
          lightColor='text-themeHighlight'
          darkColor='text-themeHighlight'
        />
      </div>
      <div className='absolute top-0 flex w-full h-full'>
        {/* left */}
        <div className='relative flex items-center justify-end w-full h-full'>
          <motion.div
            key='videoTitle'
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10, transition: { delay: 0 } }}
            className='z-10'
          >
            <Heading
              onClick={handleClick}
              className='z-10 transition-colors duration-300 ease-in-out cursor-pointer text-8xl text-themeBackground'
            >
              Video
            </Heading>
          </motion.div>

          <MotionFadeUp
            k='navbtn'
            animate={{ transition: { delay: 0.7 } }}
            exit={{ transition: { delay: 0.4 } }}
            className='relative'
          >
            <NavBtn
              href='/login'
              className='absolute z-10 -mb-32 text-left focus:outline-none bottom-1/2 bg-themeBackground hover:text-themeBackground'
            >
              Let's Go
            </NavBtn>
          </MotionFadeUp>

          {/* orange background slider */}
          <motion.div
            key='orangeBg'
            initial={{ x: '-100%' }}
            animate={{
              x: 0,
              transition: {
                duration: 0.8,
              },
            }}
            exit={{
              x: '-100%',
              transition: {
                delay: 0.6,
                duration: 0.8,
              },
            }}
            className='absolute z-0 w-full h-full bg-themeHighlight'
          ></motion.div>
        </div>

        {/* right */}
        <div className='flex items-center justify-start flex-shrink w-full h-full transition-colors duration-300 ease-in-out bg-themeBackground'>
          <MotionFadeUp
            k='note'
            animate={{ transition: { delay: 0.5 } }}
            exit={{ y: -10, transition: { delay: 0 } }}
          >
            <Heading
              onClick={handleClick}
              className='cursor-pointer text-themeHighlight text-8xl'
            >
              Note
            </Heading>
          </MotionFadeUp>
        </div>
      </div>
    </Layout>
  )
}
