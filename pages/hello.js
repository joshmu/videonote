import Layout from '../src/components/Layout'
import { useThemeContext } from '../src/context/themeContext'
import NavBtn from '../src/components/shared/NavBtn'
import { Heading } from '../src/components/shared/Text'
import ThemeToggle from '../src/components/ThemeToggle'
import { motion } from 'framer-motion'
import MotionFadeUp from '../src/components/shared/MotionFadeUp'
import Router from 'next/router'

export default function Home() {
  const { toggleTheme } = useThemeContext()

  const handleClick = () => {
    Router.push('/login')
  }

  return (
    <Layout>
      {/* theme toggle */}
      <div className='absolute top-0 right-0 z-50 p-4 text-2xl hover:text-highlight-400'>
        <ThemeToggle
          lightColor='text-highlight-400'
          darkColor='text-highlight-400'
        />
      </div>

      {/* landing */}
      <div className='absolute top-0 flex w-full h-full'>
        {/* left */}
        <div className='relative flex items-center justify-end w-full h-full'>
          <motion.div
            key='videoTitle'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.2 } }}
            exit={{ opacity: 0, y: -10, transition: { delay: 0 } }}
            className='z-10'
          >
            <Heading
              onClick={handleClick}
              className='z-10 transition-colors duration-300 ease-in-out cursor-pointer text-8xl text-themeBg'
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
              className='absolute z-10 -mb-32 text-left focus:outline-none bottom-1/2 bg-themeBg hover:text-themeBg'
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
            className='absolute z-0 w-full h-full bg-highlight-400'
          ></motion.div>
        </div>

        {/* right */}
        <div className='flex items-center justify-start flex-shrink w-full h-full transition-colors duration-300 ease-in-out bg-themeBg'>
          <MotionFadeUp
            k='note'
            animate={{ transition: { delay: 0.5 } }}
            exit={{ y: -10, transition: { delay: 0 } }}
          >
            <Heading
              onClick={handleClick}
              className='relative cursor-pointer text-highlight-400 text-8xl'
            >
              Note
              <span
                className='absolute bottom-0 z-40 p-1 px-2 ml-2 -mb-1 text-2xl tracking-tight transform rounded-sm text-themeBg semi-bold animate-pulse bg-highlight-400'
                style={{ transform: 'rotate(-15deg)' }}
              >
                BETA
              </span>
            </Heading>
          </MotionFadeUp>
        </div>
      </div>
    </Layout>
  )
}
