import Head from 'next/head'
import { useThemeContext } from '../context/themeContext'
import { motion } from 'framer-motion'

export default function Layout({ children }) {
  const { theme } = useThemeContext()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Head>
        <title>VideoNote</title>
      </Head>
      <div
        className={`${
          theme === 'light' ? 'theme-light' : 'theme-dark'
        } text-themeText relative min-h-screen bg-themeBackground transition-colors duration-300 ease-in-out font-sans overflow-hidden`}
      >
        <main>{children}</main>
      </div>
    </motion.div>
  )
}
