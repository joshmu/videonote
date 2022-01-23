/**
 * @path /src/components/HelloPage/Hero/Hero.tsx
 *
 * @project videonote
 * @file Hero.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Thursday, 22nd October 2020
 * @modified Sunday, 23rd January 2022 6:10:35 pm
 * @copyright © 2020 - 2020 MU
 */

import { motion } from 'framer-motion'
import Link from 'next/link'
import Router from 'next/router'

import { MotionFadeUp } from '@/components/shared/ux/MotionFadeUp'

import { HeroTitle } from './HeroTitle/HeroTitle'
import { NotesBackground } from './NotesBackground/NotesBackground'
import { ScrollDown } from './ScrollDown/ScrollDown'
import { VideoBackground } from './VideoBackground/VideoBackground'

export const Hero = () => {
  const handleClick = (): void => {
    Router.push('/login')
  }

  return (
    <div className='relative w-full' style={{ minHeight: 'max(60vh, 400px)' }}>
      <div className='absolute top-0 flex w-full h-full'>
        {/* left */}
        <div className='relative flex items-center justify-end w-full h-full'>
          <motion.div
            key='videoTitle'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.2 } }}
            className='z-10'
          >
            <HeroTitle onClick={handleClick} className='text-themeBg'>
              Video
            </HeroTitle>
          </motion.div>

          {/* let's go button */}
          <MotionFadeUp
            k='navbtn'
            animate={{ transition: { delay: 0.7 } }}
            className='relative'
          >
            <Link href='/login'>
              <motion.button
                whileHover={{ scale: 1.1 }}
                className='absolute z-10 px-3 py-2 -mb-32 tracking-wider text-left uppercase rounded-r-sm cursor-pointer focus:outline-none bottom-1/2 text-themeAccent'
              >
                Let's Go
              </motion.button>
            </Link>
          </MotionFadeUp>

          {/* left slider bg */}
          <motion.div
            key='leftSliderBg'
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
                duration: 0.6,
              },
            }}
            className='absolute z-0 w-full transition-colors duration-300 ease-in-out rounded-r-md h-5/6 bg-themeAccent'
          >
            <VideoBackground />
          </motion.div>
        </div>

        {/* right */}
        <div className='relative flex items-center justify-start flex-shrink w-full h-full transition-colors duration-300 ease-in-out'>
          <MotionFadeUp
            k='note'
            animate={{ transition: { delay: 0.5 } }}
            className='z-10'
          >
            <HeroTitle onClick={handleClick} className='text-themeAccent'>
              Note
            </HeroTitle>
          </MotionFadeUp>

          <NotesBackground />
        </div>
      </div>

      <ScrollDown to={'overview'} style={{ paddingTop: '4rem' }} />
    </div>
  )
}
