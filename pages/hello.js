import { motion } from 'framer-motion'
import Link from 'next/link'

import Hero from '@/components/HelloPage/Hero/Hero'
import Layout from '@/components/Layout/Layout'
import ThemeToggle from '@/components/shared/ThemeToggle/ThemeToggle'
import Parallax from '@/components/shared/ux/Parallax'

const HelloPage = () => {
  const handleAboutClick = e => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Layout>
      <div className='absolute top-0 right-0 z-50 p-4 text-2xl hover:text-themeAccent'>
        <ThemeToggle
          lightColor='text-themeAccent'
          darkColor='text-themeAccent'
        />
      </div>

      <Hero />

      <div className='flex items-center w-full h-screen transition-colors duration-300 ease-in-out bg-themeBg2'>
        <div className='w-4/5 mx-auto font-sans text-2xl leading-8 tracking-tight sm:w-3/4 md:w-1/2'>
          <Parallax rate={0.15}>
            <div>
              <p>
                <span className='text-4xl text-themeAccent'>VideoNote</span>{' '}
                aims to provide the fastest possible workflow to review video
                content.
              </p>
              <p className='mt-4'>
                Utilising a variety of intuitive keyboard shortcuts, seamless
                sharing of projects with a minimal design to keep you focused on
                what matters most.
              </p>
              <p className='mt-4'>
                We are currently in a beta development stage. If you have
                feature requests or any feedback then the VideoNote team would
                love to hear from you.
              </p>
              <div className='w-full mt-4 text-right'>
                <a
                  href='mailto:hello@videonote.app'
                  className='text-xl cursor-pointer text-themeAccent'
                >
                  hello@videonote.app
                </a>
              </div>
            </div>
          </Parallax>

          <div className='w-full text-center'>
            <Parallax rate={-0.3}>
              <Link href='/login'>
                <motion.button
                  onClick={handleAboutClick}
                  whileHover={{ scale: 1.1 }}
                  className='px-4 py-2 text-2xl italic tracking-tight transition-colors duration-300 ease-in-out rounded-sm cursor-pointer focus:outline-none hover:text-themeAccent text-themeText'
                >
                  And away we go!
                </motion.button>
              </Link>
            </Parallax>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default HelloPage
