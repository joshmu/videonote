/**
 * @path /pages/_app.tsx
 *
 * @project videonote
 * @file _app.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Sunday, 1st May 2022 11:34:46 am
 * @copyright © 2020 - 2020 MU
 */

import '@/styles/globals.scss'

import { AnimatePresence } from 'framer-motion'
import { AppProps } from 'next/app'

import { NotificationProvider } from '@/context/notificationContext'

import { ThemeProvider } from '../src/context/themeContext'
import { UserProvider } from '@auth0/nextjs-auth0'

const MyApp = ({ Component, pageProps, router }: AppProps) => {
  return (
    <UserProvider>
      <NotificationProvider>
        <ThemeProvider>
          <AnimatePresence exitBeforeEnter>
            <Component {...pageProps} key={router.route} />
          </AnimatePresence>
        </ThemeProvider>
      </NotificationProvider>
    </UserProvider>
  )
}

export default MyApp
