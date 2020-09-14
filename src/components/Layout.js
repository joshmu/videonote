import Head from 'next/head'
import { useThemeContext } from '../context/themeContext'
import { AnimatePresence, motion } from 'framer-motion'

export default function Layout({ children }) {
  const { theme } = useThemeContext()
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Head>
          <title>Next.js Tailwind CSS Starter</title>
        </Head>
        <div
          className={`${
            theme === 'light' ? 'theme-light' : 'theme-dark'
          } text-themeText relative min-h-screen bg-themeBackground transition-colors duration-300 ease-in-out font-sans overflow-hidden`}
        >
          <div className='container mx-auto'>
            <main>{children}</main>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
