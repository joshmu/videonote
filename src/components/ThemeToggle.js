import { AnimatePresence, motion } from 'framer-motion'
import { HiSun as SunIcon } from 'react-icons/hi'
import { BsMoon as MoonIcon } from 'react-icons/bs'
import { useThemeContext } from '../context/themeContext'
import Reveal from './shared/Reveal'

export default function ThemeToggle({
  lightColor = 'text-themeText',
  darkColor = 'text-themeText',
  revealVariants = {},
  revealTransition = {},
  className = '',
  ...props
}) {
  const { toggleTheme, theme } = useThemeContext()

  const handleClick = () => {
    toggleTheme()
  }

  return (
    <Reveal
      onClick={handleClick}
      className={`${className} ${
        theme === 'dark' ? lightColor : darkColor
      } absolute text-2xl top-0 right-0 z-50 p-4 transition-colors duration-300 ease-in-out cursor-pointer hover:text-themeHighlight`}
      {...props}
      variants={revealVariants}
      transition={revealTransition}
    >
      <AnimatePresence exitBeforeEnter>
        {theme === 'dark' ? (
          <motion.div
            key='dark'
            initial={{ opacity: 0, rotate: -180, scale: 0 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 180, scale: 0 }}
            className='relative'
          >
            <MoonIcon className='fill-current' />
          </motion.div>
        ) : (
          <motion.div
            key='light'
            initial={{ opacity: 0, rotate: -180, scale: 0 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 180, scale: 0 }}
            className='relative'
          >
            <SunIcon className='fill-current' />
          </motion.div>
        )}
      </AnimatePresence>
    </Reveal>
  )
}
