import { GlobalProvider } from '../src/context/globalContext'
import { VideoProvider } from '../src/context/videoContext'
import { TodoProvider } from '../src/context/todoContext'
import { ThemeProvider } from '../src/context/themeContext'
import { NotificationProvider } from '../src/context/notificationContext'

import { AnimatePresence } from 'framer-motion'

import '../styles/globals.scss'

function MyApp({ Component, pageProps, router }) {
  return (
    <NotificationProvider>
      <GlobalProvider>
        <VideoProvider>
          <TodoProvider>
            <ThemeProvider>
              <AnimatePresence exitBeforeEnter>
                <Component {...pageProps} key={router.route} />
              </AnimatePresence>
            </ThemeProvider>
          </TodoProvider>
        </VideoProvider>
      </GlobalProvider>
    </NotificationProvider>
  )
}

export default MyApp
