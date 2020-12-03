/**
 * @path /pages/hello.tsx
 *
 * @project videonote
 * @file hello.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 14th September 2020
 * @modified Thursday, 3rd December 2020 5:58:22 pm
 * @copyright © 2020 - 2020 MU
 */

import { NextPage } from 'next'

import { Features } from '@/components/HelloPage/Features/Features'
import { Hero } from '@/components/HelloPage/Hero/Hero'
import { Layout } from '@/components/Layout/Layout'
import ThemeToggle from '@/components/shared/ThemeToggle/ThemeToggle'

const HelloPage: NextPage = () => {
  // const handleAboutClick = (): void => {
  //   window.scrollTo({ top: 0, behavior: 'smooth' })
  // }

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
    </Layout>
  )
}

export default HelloPage
