import Head from 'next/head'
import { useThemeContext } from '../context/themeContext'

export default function Layout({ children }) {
  const { theme } = useThemeContext()
  return (
    <>
      <Head>
        <title>Next.js Tailwind CSS Starter</title>
      </Head>
      <div
        className={`${
          theme === 'light' ? 'theme-light' : 'theme-dark'
        } text-themeText min-h-screen bg-themeBackground transition-colors duration-300 ease-in-out font-sans overflow-hidden`}
      >
        <div className='container mx-auto'>
          <main>{children}</main>
        </div>
      </div>
    </>
  )
}
