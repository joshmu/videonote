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
