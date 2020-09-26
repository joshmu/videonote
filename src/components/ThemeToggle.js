import { motion } from 'framer-motion'
import { HiSun as SunIcon } from 'react-icons/hi'
import { BsMoon as MoonIcon } from 'react-icons/bs'
import { useThemeContext } from '../context/themeContext'
import { AnimatePresence } from 'framer-motion'

export default function ThemeToggle({
  lightColor = 'text-themeText',
  darkColor = 'text-themeText',
  className = '',
  ...props
}) {
  const { toggleTheme, theme } = useThemeContext()

  const handleClick = () => {
    toggleTheme()
  }

  const motionStyle = {
    initial: { opacity: 0, rotate: -180, scale: 0 },
    animate: { opacity: 1, rotate: 0, scale: 1 },
    exit: { opacity: 0, rotate: 180, scale: 0 },
  }

  return (
    <motion.div
      key='themeToggle'
      {...motionStyle}
      onClick={handleClick}
      className={`${className} ${
        theme === 'light' ? lightColor : darkColor
      } cursor-pointer relative flex items-center`}
      {...props}
    >
      <AnimatePresence exitBeforeEnter>
        {theme === 'dark' ? (
          <motion.button
            key='themeToggle-dark'
            {...motionStyle}
            className='relative focus:outline-none'
          >
            <MoonIcon className='fill-current' />
          </motion.button>
        ) : (
          <motion.button
            key='themeToggle-light'
            {...motionStyle}
            className='relative focus:outline-none'
          >
            <SunIcon className='fill-current' />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
