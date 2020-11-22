/**
 * @path /pages/_app.tsx
 *
 * @project videonote
 * @file _app.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Sunday, 22nd November 2020 6:58:30 pm
 * @copyright © 2020 - 2020 MU
 */

import '@/styles/globals.scss'

import { AnimatePresence } from 'framer-motion'
import { AppProps } from 'next/app'

import { NotificationProvider } from '@/context/notificationContext'

import { ThemeProvider } from '../src/context/themeContext'

const MyApp = ({ Component, pageProps, router }: AppProps) => {
  return (
    <NotificationProvider>
      <ThemeProvider>
        <AnimatePresence exitBeforeEnter>
          <Component {...pageProps} key={router.route} />
        </AnimatePresence>
      </ThemeProvider>
    </NotificationProvider>
  )
}

export default MyApp
