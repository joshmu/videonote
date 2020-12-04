/**
 * @path /pages/hello.tsx
 *
 * @project videonote
 * @file hello.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 14th September 2020
 * @modified Friday, 4th December 2020 12:10:33 pm
 * @copyright © 2020 - 2020 MU
 */

import { NextPage } from 'next'
import { useRouter } from 'next/router'

import { Features } from '@/components/HelloPage/Features/Features'
import { Hero } from '@/components/HelloPage/Hero/Hero'
import { Layout } from '@/components/Layout/Layout'
import { ThemeToggle } from '@/components/shared/ThemeToggle/ThemeToggle'
import { Reveal } from '@/components/shared/ux/Reveal'
import { Footer } from '@/root/src/components/Layout/Footer/Footer'

const HelloPage: NextPage = () => {
  return (
    <Layout>
      <div className='fixed top-0 right-0 z-50 p-4 text-2xl hover:text-themeAccent'>
        <ThemeToggle
          lightColor='text-themeAccent'
          darkColor='text-themeAccent'
        />
      </div>

      <Hero />
      <Features />
      <CTA />

      <Footer />
    </Layout>
  )
}

export default HelloPage

const CTA = () => {
  const router = useRouter()

  const handleStart = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
