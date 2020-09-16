import Link from 'next/link'
import Layout from '../src/components/Layout'
import ThemeToggle from '../src/components/ThemeToggle'
import LoginModal from '../src/components/LoginModal/LoginModal'

export default function Login() {
  return (
    <Layout>
      <ThemeToggle />
      <div className='flex items-center justify-center h-screen'>
        <LoginModal />
      </div>
    </Layout>
  )
}
