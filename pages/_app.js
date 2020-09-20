import { GlobalProvider } from '../src/context/globalContext'
import { VideoProvider } from '../src/context/videoContext'
import { TodoProvider } from '../src/context/todoContext'
import { ThemeProvider } from '../src/context/themeContext'

import { AnimatePresence } from 'framer-motion'

import '../styles/globals.css'

function MyApp({ Component, pageProps, router }) {
  return (
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
  )
}

export default MyApp
