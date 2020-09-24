import { motion } from 'framer-motion'
import { HiSun as SunIcon } from 'react-icons/hi'
import { BsMoon as MoonIcon } from 'react-icons/bs'
import { useThemeContext } from '../context/themeContext'

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

  return (
    <div
      onClick={handleClick}
      className={`${className} ${
        theme === 'light' ? lightColor : darkColor
      } transition-colors duration-300 ease-in-out cursor-pointer w-full h-full relative flex items-center`}
      {...props}
    >
      {theme === 'dark' ? (
        <motion.button
          key='themeToggle-dark'
          initial={{ opacity: 0, rotate: -180, scale: 0 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 180, scale: 0 }}
          className='relative focus:outline-none'
        >
          <MoonIcon className='fill-current' />
        </motion.button>
      ) : (
        <motion.button
          key='themeToggle-light'
          initial={{ opacity: 0, rotate: -180, scale: 0 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 180, scale: 0 }}
          className='relative focus:outline-none'
        >
          <SunIcon className='fill-current' />
        </motion.button>
      )}
    </div>
  )
}
