/**
 * @path /pages/hello.tsx
 *
 * @project videonote
 * @file hello.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 14th September 2020
 * @modified Wednesday, 2nd December 2020 3:02:25 pm
 * @copyright © 2020 - 2020 MU
 */

import { NextPage } from 'next'

import { Hero } from '@/components/HelloPage/Hero/Hero'
import { Layout } from '@/components/Layout/Layout'
import ThemeToggle from '@/components/shared/ThemeToggle/ThemeToggle'

const HelloPage: NextPage = () => {
  // const handleAboutClick = (): void => {
  //   window.scrollTo({ top: 0, behavior: 'smooth' })
  // }

  return (
    <Layout>
      <div className='absolute top-0 right-0 z-50 p-4 text-2xl hover:text-themeAccent'>
        <ThemeToggle
          lightColor='text-themeAccent'
          darkColor='text-themeAccent'
        />
      </div>

      <Hero />

      {/* <div classname='flex items-center w-full py-12 transition-colors duration-300 ease-in-out min-h-screenvh bg-themebg'>
        <div className='w-full mx-4 font-sans text-xl leading-8 tracking-tight md:text-2xl md:mx-auto md:w-3/4'>
          <div>
            <p>
              <span className='text-4xl text-themeAccent'>VideoNote</span> aims
              to provide the fastest possible workflow to review video content.
            </p>
            <p className='mt-4'>
              Utilising a variety of intuitive keyboard shortcuts, seamless
              sharing of projects with a minimal design to keep you focused on
              what matters most.
            </p>
            <p className='mt-4'>
              We are currently in a beta development stage. If you have feature
              requests or any feedback then the VideoNote team would love to
              hear from you.
            </p>
            <div className='w-full mt-4 text-right'>
              <a
                href='mailto:hello@videonote.app'
                className='text-lg cursor-pointer md:text-xl text-themeAccent'
              >
                hello@videonote.app
              </a>
            </div>
          </div>

          <div className='w-full text-center'>
            <Link href='/login'>
              <motion.button
                onClick={handleAboutClick}
                whileHover={{ scale: 1.1 }}
                className='px-4 py-2 text-xl italic tracking-tight transition-colors duration-300 ease-in-out rounded-sm cursor-pointer md:text-2xl focus:outline-none hover:text-themeAccent text-themeText'
              >
                And away we go!
              </motion.button>
            </Link>
          </div>
        </div>
      </div> */}
    </Layout>
  )
}

export default HelloPage
