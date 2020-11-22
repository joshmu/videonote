/**
 * @path /src/components/Layout/Layout.tsx
 *
 * @project videonote
 * @file Layout.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 14th September 2020
 * @modified Sunday, 22nd November 2020 6:31:48 pm
 * @copyright © 2020 - 2020 MU
 */

import Head from 'next/head'
import { ReactNode } from 'react'

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <Head>
        <title>VideoNote</title>
      </Head>
      <div className='relative min-h-screen overflow-hidden font-sans antialiased transition-colors duration-300 ease-in-out debug-screens'>
        <main>
          <div className='flex flex-col w-full h-screen overflow-hidden'>
            {children}
          </div>
        </main>
      </div>
    </>
  )
}
