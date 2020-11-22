/**
 * @path /src/components/shared/ThemeToggle/ThemeToggle.js
 *
 * @project videonote
 * @file ThemeToggle.js
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 15th September 2020
 * @modified Sunday, 22nd November 2020 9:54:38 am
 * @copyright © 2020 - 2020 MU
 */

import { motion } from 'framer-motion'
import { AnimatePresence } from 'framer-motion'
import { BsMoon as MoonIcon, BsLightningFill as ZapIcon } from 'react-icons/bs'
import { GiHeatHaze as HotIcon } from 'react-icons/gi'
import { HiSun as SunIcon } from 'react-icons/hi'

import { useThemeContext } from '@/context/themeContext'

export default function ThemeToggle({
  lightColor = '',
  darkColor = '',
  className = '',
  ...props
}) {
  const { toggleTheme, theme, THEME_TYPES } = useThemeContext()

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
      whileHover={{ scale: 1.1 }}
      key='themeToggle'
      {...motionStyle}
      onClick={handleClick}
      className={`${className} ${
        theme === 'light' ? lightColor : darkColor
      } cursor-pointer relative flex items-center`}
      {...props}
    >
      <AnimatePresence exitBeforeEnter>
        {theme === 'dark' && (
          <motion.button
            key='themeToggle-dark'
            {...motionStyle}
            className='relative focus:outline-none'
          >
            <MoonIcon className='fill-current' />
          </motion.button>
        )}

        {theme === 'light' && (
          <motion.button
            key='themeToggle-light'
            {...motionStyle}
            className='relative focus:outline-none'
          >
            <SunIcon className='fill-current' />
          </motion.button>
        )}

        {theme === 'superhero' && (
          <motion.button
            key='themeToggle-superhero'
            {...motionStyle}
            className='relative focus:outline-none'
          >
            <ZapIcon className='fill-current' />
          </motion.button>
        )}

        {theme === 'hot' && (
          <motion.button
            key='themeToggle-hot'
            {...motionStyle}
            className='relative focus:outline-none'
          >
            <HotIcon className='fill-current' />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
