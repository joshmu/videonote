import { useState } from 'react'
import Layout from '../src/components/Layout'
import ThemeToggle from '../src/components/ThemeToggle'
import LoginView from '../src/components/Login/Login'
import RegisterView from '../src/components/Register/Register'
import Notification from '../src/components/Notification/Notification'
import Router from 'next/router'
import { handleJwtToken } from '../utils/clientHelpers'

export default function Login() {
  const [loginView, setLoginView] = useState(true)

  const toggleLoginView = (state = undefined) => {
    const cmd = state === undefined ? !loginView : state
    setLoginView(cmd)
  }

  const handleLogin = data => {
    handleJwtToken(data.token)

    // todo: can we pass the user data here to avoid the additional request?
    Router.push('/vn')
  }

  return (
    <Layout>
      <div className='absolute top-0 right-0 z-50 p-4 text-2xl hover:text-themeHighlight'>
        <ThemeToggle />
      </div>
      <div className='flex items-center justify-center h-screen'>
        {loginView ? (
          <LoginView
            toggleLoginView={toggleLoginView}
            handleLogin={handleLogin}
          />
        ) : (
          <RegisterView
            toggleLoginView={toggleLoginView}
            handleLogin={handleLogin}
          />
        )}
      </div>

      <Notification />
    </Layout>
  )
}
