/**
 * @path /src/components/HelloPage/CTA/CTA.tsx
 *
 * @project videonote
 * @file CTA.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Friday, 4th December 2020
 * @modified Friday, 11th December 2020 12:28:43 pm
 * @copyright © 2020 - 2020 MU
 */

import { useRouter } from 'next/router'
import { animateScroll as scroll } from 'react-scroll'

import { Reveal } from '@/shared/ux/Reveal'

export const CTA = () => {
  const router = useRouter()

  const handleStart = () => {
    scroll.scrollToTop({
      duration: 600,
    })
    // window.scrollTo({ top: 0, behavior: 'smooth' })
    router.push('/login')
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
