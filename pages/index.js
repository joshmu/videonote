import Layout from '../src/components/Layout'
import { useThemeContext } from '../src/context/themeContext'
import NavBtn from '../src/components/shared/NavBtn'
import { Heading } from '../src/components/shared/Text'
import ThemeToggle from '../src/components/ThemeToggle'
import { motion } from 'framer-motion'
import Reveal from '../src/components/shared/Reveal'

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
        revealVariants={{
          initial: { opacity: 0, rotate: -180, scale: 0 },
          animate: { opacity: 1, rotate: 0, scale: 1 },
          exit: { opacity: 0, rotate: 180, scale: 0 },
        }}
        revealTransition={{
          delay: 0.8,
        }}
      />
      <div className='absolute top-0 flex w-full h-full'>
        {/* left */}
        <div className='relative flex items-center justify-end w-full h-full'>
          <Heading
            onClick={handleClick}
            className='z-10 transition-colors duration-300 ease-in-out cursor-pointer text-8xl text-themeBackground'
          >
            Video
          </Heading>

          <Reveal transition={{ delay: 0.7 }}>
            <NavBtn
              href='/login'
              className='absolute z-10 -mb-32 bottom-1/2 bg-themeBackground hover:text-themeBackground'
            >
              Let's Go
            </NavBtn>
          </Reveal>

          {/* orange background slider */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{
              duration: 0.8,
              ease: [0.6, 0.05, -0.01, 0.9],
            }}
            className='absolute z-0 w-full h-full bg-themeHighlight'
          ></motion.div>
        </div>

        {/* right */}
        <div className='flex items-center justify-start w-full h-full transition-colors duration-300 ease-in-out bg-themeBackground'>
          <Reveal transition={{ delay: 0.5 }}>
            <Heading
              onClick={handleClick}
              className='cursor-pointer text-themeHighlight text-8xl'
            >
              Note
            </Heading>
          </Reveal>
        </div>
      </div>
    </Layout>
  )
}
