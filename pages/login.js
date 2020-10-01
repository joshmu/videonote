import { useState } from 'react'
import Layout from '../src/components/Layout'
import ThemeToggle from '../src/components/ThemeToggle'
import LoginView from '../src/components/Login/Login'
import RegisterView from '../src/components/Register/Register'
import Notification from '../src/components/Notification/Notification'

export default function Login() {
  const [loginView, setLoginView] = useState(true)

  const toggleLoginView = (state = undefined) => {
    const cmd = state === undefined ? !loginView : state
    setLoginView(cmd)
  }

  return (
    <Layout>
      <div className='absolute top-0 right-0 z-50 p-4 text-2xl hover:text-themeHighlight'>
        <ThemeToggle />
      </div>
      <div className='flex items-center justify-center h-screen'>
        {loginView ? (
          <LoginView toggleLoginView={toggleLoginView} />
        ) : (
          <RegisterView toggleLoginView={toggleLoginView} />
        )}
      </div>

      <Notification />
    </Layout>
  )
}
