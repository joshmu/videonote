/**
 * @path /src/components/shared/ThemeToggle/ThemeToggle.tsx
 *
 * @project videonote
 * @file ThemeToggle.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 15th September 2020
 * @modified Friday, 4th December 2020 11:14:54 am
 * @copyright © 2020 - 2020 MU
 */

import { Variants, motion } from 'framer-motion'
import { AnimatePresence } from 'framer-motion'
import { BsMoon as MoonIcon, BsLightningFill as ZapIcon } from 'react-icons/bs'
import { GiHeatHaze as HotIcon } from 'react-icons/gi'
import { HiSun as SunIcon } from 'react-icons/hi'

import { ThemeType, useThemeContext } from '@/context/themeContext'

interface ThemeToggleInterface {
  lightColor?: string
  darkColor?: string
  className?: string
  props?: object
}

export const ThemeToggle = ({
  lightColor = '',
  darkColor = '',
  className = '',
  ...props
}: ThemeToggleInterface) => {
  const { toggleTheme, theme } = useThemeContext()

  const handleClick = (): void => {
    toggleTheme()
  }

  const motionStyle: Variants = {
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
        ThemeType.LIGHT === theme ? lightColor : darkColor
      } cursor-pointer relative flex items-center`}
      {...props}
    >
      <AnimatePresence exitBeforeEnter>
        {ThemeType.DARK === theme && (
          <motion.button
            key='themeToggle-dark'
            {...motionStyle}
            className='relative focus:outline-none'
          >
            <MoonIcon className='fill-current' />
          </motion.button>
        )}

        {ThemeType.LIGHT === theme && (
          <motion.button
            key='themeToggle-light'
            {...motionStyle}
            className='relative focus:outline-none'
          >
            <SunIcon className='fill-current' />
          </motion.button>
        )}

        {ThemeType.SUPERHERO === theme && (
          <motion.button
            key='themeToggle-superhero'
            {...motionStyle}
            className='relative focus:outline-none'
          >
            <ZapIcon className='fill-current' />
          </motion.button>
        )}

        {ThemeType.HOT === theme && (
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
