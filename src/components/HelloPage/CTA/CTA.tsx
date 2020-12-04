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
      <div className='relative flex items-center justify-center pb-16'>
        <button
          className='relative font-serif text-4xl text-themeAccent focus:outline-none'
          onClick={handleStart}
        >
          <div className='w-full h-px mb-4 transform bg-gradient-to-l from-themeAccent -rotate-3'></div>
          <span>Let's get started!</span>
          <div className='w-full h-px mt-4 transform bg-gradient-to-r from-themeAccent -rotate-3'></div>
        </button>
      </div>
    </Reveal>
  )
}
