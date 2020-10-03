import { ThemeProvider } from '../src/context/themeContext'
import { NotificationProvider } from '../src/context/notificationContext'

import { AnimatePresence } from 'framer-motion'

import '../styles/globals.scss'

function MyApp({ Component, pageProps, router }) {
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
