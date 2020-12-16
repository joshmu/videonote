/**
 * @path /src/components/HelloPage/CTA/CTA.tsx
 *
 * @project videonote
 * @file CTA.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Friday, 4th December 2020
 * @modified Tuesday, 15th December 2020 10:13:17 am
 * @copyright © 2020 - 2020 MU
 */

import { useRouter } from 'next/router'
import { MouseEvent } from 'react'
import { animateScroll as scroll } from 'react-scroll'

import { Reveal } from '@/shared/ux/Reveal'

export const CTA = () => {
  const router = useRouter()

  const handleStart = (event: MouseEvent) => {
    event.preventDefault()
    const duration = 600

    scroll.scrollToTop({
      duration,
    })

    // * scroll to top during next router change is causing animate presence conflict?
    // route change instead after completed animation event
    setTimeout(() => {
      // window.scrollTo({ top: 0, behavior: 'smooth' })
      router.push('/login')
    }, duration)
  }

  return (
    <Reveal>
      <div className='relative flex items-center justify-center pb-16 mt-8'>
        <button
          className='relative font-serif text-4xl italic transition-colors duration-300 ease-in-out focus:outline-none hover:text-themeAccent'
          onClick={handleStart}
        >
          <span>Let's get started!</span>
          <div className='w-full h-1 mt-6 rounded-full bg-gradient-to-r from-themeAccent'></div>
        </button>
      </div>
    </Reveal>
  )
}
