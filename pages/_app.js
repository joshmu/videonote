import { GlobalProvider } from '../src/context/globalContext'
import { ThemeProvider } from '../src/context/themeContext'
import { AnimatePresence } from 'framer-motion'

import '../styles/globals.css'

function MyApp({ Component, pageProps, router }) {
  return (
    <GlobalProvider>
      <ThemeProvider>
        <AnimatePresence exitBeforeEnter>
          <Component {...pageProps} key={router.route} />
        </AnimatePresence>
      </ThemeProvider>
    </GlobalProvider>
  )
}

export default MyApp
