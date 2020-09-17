import Head from 'next/head'
import { useThemeContext } from '../context/themeContext'

export default function Layout({ children }) {
  const { theme } = useThemeContext()
  return (
    <>
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
    </>
  )
}
