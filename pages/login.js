import Link from 'next/link'
import Layout from '../src/components/Layout'
import ThemeToggle from '../src/components/ThemeToggle'
import LoginModal from '../src/components/LoginModal/LoginModal'

export default function Login() {
  return (
    <Layout>
      <div className='absolute top-0 right-0 z-50 p-4 text-2xl hover:text-themeHighlight'>
        <ThemeToggle />
      </div>
      <div className='flex items-center justify-center h-screen'>
        <LoginModal />
      </div>
    </Layout>
  )
}
