/**
 * @path /pages/hello.tsx
 *
 * @project videonote
 * @file hello.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 14th September 2020
 * @modified Sunday, 1st May 2022 12:11:17 pm
 * @copyright © 2020 - 2020 MU
 */

import { NextPage } from 'next'

import { CTA } from '@/components/HelloPage/CTA/CTA'
import { Features } from '@/components/HelloPage/Features/Features'
import { Hero } from '@/components/HelloPage/Hero/Hero'
import { Overview } from '@/components/HelloPage/Overview/Overview'
import { Footer } from '@/components/Layout/Footer/Footer'
import { Layout } from '@/components/Layout/Layout'
import { ThemeToggle } from '@/shared/ThemeToggle/ThemeToggle'

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
      <Overview />
      <Features />
      <CTA />

      <Footer />
    </Layout>
  )
}

export default HelloPage
