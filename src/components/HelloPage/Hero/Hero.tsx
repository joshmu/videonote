/**
 * @path /src/components/HelloPage/Hero/Hero.tsx
 *
 * @project videonote
 * @file Hero.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Thursday, 22nd October 2020
 * @modified Thursday, 3rd December 2020 5:57:21 pm
 * @copyright © 2020 - 2020 MU
 */

import { motion } from 'framer-motion'
import Link from 'next/link'
import Router from 'next/router'

import { Heading } from '@/components/shared/Text/Text'
import { MotionFadeUp } from '@/components/shared/ux/MotionFadeUp'

export const Hero = () => {
  const handleClick = (): void => {
    Router.push('/login')
  }

  return (
    <div className='relative w-full min-h-screen'>
      <div className='absolute top-0 flex w-full h-screen'>
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
            <Link href='/login'>
              <button className='absolute z-10 px-3 py-2 -mb-32 tracking-wider text-left uppercase transition-colors duration-300 ease-in-out rounded-r-sm cursor-pointer focus:outline-none bottom-1/2 hover:text-themeBg text-themeAccent hover:bg-themeAccent'>
                Let's Go
              </button>
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
                delay: 0.6,
                duration: 0.8,
              },
            }}
            className='absolute z-0 w-full transition-colors duration-300 ease-in-out rounded-r-md h-5/6 bg-themeAccent'
          >
            {/* neu video background */}
            <motion.div
              key='neu-video-image-bg'
              initial={{
                opacity: 0,
              }}
              animate={{ opacity: 1, transition: { delay: 0.8 } }}
              exit={{ opacity: 0 }}
              className='flex items-center justify-center w-full h-full'
            >
              <div className='w-3/4 neu-accent h-1/2'></div>
            </motion.div>
          </motion.div>
        </div>

        {/* right */}
        <div className='relative flex items-center justify-start flex-shrink w-full h-full transition-colors duration-300 ease-in-out'>
          <MotionFadeUp
            k='note'
            animate={{ transition: { delay: 0.5 } }}
            className='z-10'
            exit={{ y: -10, transition: { delay: 0 } }}
          >
            <Heading
              onClick={handleClick}
              className='transition-colors duration-300 ease-in-out cursor-pointer text-themeAccent text-8xl'
            >
              Note
            </Heading>
          </MotionFadeUp>

          {/* neu notes background */}
          <motion.div
            key='neu-notes-bg-image'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.8 } }}
            exit={{ opacity: 0 }}
            className='absolute z-0 flex items-center justify-center w-full h-full'
          >
            <div className='flex flex-col justify-between w-3/4 transition-colors duration-300 ease-in-out h-1/2'>
              <div className='h-1/12 neu-bg'></div>
              <div className='h-1/12 neu-bg'></div>
              <div className='h-1/12 neu-bg'></div>
              <div className='h-1/12 neu-bg'></div>
              <div className='h-1/12 neu-bg'></div>
              <div className='h-1/12 neu-bg'></div>
              <div className='h-1/12 neu-bg'></div>
              <div className='h-1/12 neu-bg'></div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
