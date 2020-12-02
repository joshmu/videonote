/**
 * @path /src/components/Layout/Layout.tsx
 *
 * @project videonote
 * @file Layout.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 14th September 2020
 * @modified Wednesday, 2nd December 2020 2:31:40 pm
 * @copyright © 2020 - 2020 MU
 */

import Head from 'next/head'
import { ReactNode } from 'react'

const metaData: { [key: string]: string } = {
  title: 'VideoNote',
  description: 'VideoNote - quick and easy timestamped video notes',
  keywords:
    'videonote, video, notetaking, todo, josh mu, developer, notes, review, app, timestamp',
  origin: 'https://videonote.app',
  imgUrl: 'https://videonote.app/assets/avatar.jpg',
}

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <Head>
        <title>{metaData.title}</title>

        {/* // * meta needs to be direct child of <Head> otherwise nextjs breaks... */}
        {/* HTML Meta Tags */}
        {/* Meta Tags Generated via http://heymeta.com</meta> */}
        <meta name='description' content={metaData.description} />
        <meta name='keywords' content={metaData.keywords} />

        {/* Google / Search Engine Tags */}
        <meta itemProp='name' content={metaData.title} />
        <meta itemProp='description' content={metaData.description} />
        <meta itemProp='image' content={metaData.imgUrl} />

        {/* Facebook Meta Tags */}
        <meta property='og:url' content={metaData.origin} />
        <meta property='og:type' content='website' />
        <meta property='og:title' content={metaData.title} />
        <meta property='og:description' content={metaData.description} />
        <meta property='og:image' content={metaData.imgUrl} />

        {/* Twitter Meta Tags */}
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={metaData.title} />
        <meta name='twitter:description' content={metaData.description} />
        <meta name='twitter:image' content={metaData.imgUrl} />

        {/* favicon */}
        {/* https://realfavicongenerator.net/ */}
        <link
          rel='apple-touch-icon'
          sizes='180x180'
          href='apple-touch-icon.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='32x32'
          href='favicon-32x32.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='16x16'
          href='favicon-16x16.png'
        />
        <link rel='manifest' href='site.webmanifest' />
        <link rel='mask-icon' href='safari-pinned-tab.svg' color='#5bbad5' />
        <link rel='shortcut icon' href='favicon.ico' />
        <meta name='msapplication-TileColor' content='#da532c' />
        <meta name='msapplication-config' content='browserconfig.xml' />
        <meta name='theme-color' content='#ffffff' />
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
