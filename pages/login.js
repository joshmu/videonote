import Router from 'next/router'
import { useState } from 'react'

import Layout from '@/components/Layout/Layout'
import LoginView from '@/components/LoginPage/Login/Login'
import RegisterView from '@/components/LoginPage/Register/Register'
import Notification from '@/components/Notification/Notification'
import ThemeToggle from '@/components/shared/ThemeToggle/ThemeToggle'
import useTwConfig from '@/hooks/useTwConfig'

import { handleJwtToken } from '../utils/clientHelpers'

export default function Login() {
  const [loginView, setLoginView] = useState(true)
  const [email, setEmail] = useState('')

  const twConfig = useTwConfig()

  const toggleLoginView = (state = undefined) => {
    const isLoginViewShowing = state === undefined ? !loginView : state
    setLoginView(isLoginViewShowing)
  }

  const handleLogin = data => {
    handleJwtToken(data.token)
    Router.push('/')
  }

  const handleEmail = email => setEmail(email)

  return (
    <Layout>
      <div className='absolute top-0 right-0 z-50 p-4 text-2xl text-themeAccent'>
        <ThemeToggle />
      </div>
      <div
        className='flex items-center justify-center h-screen bg-opacity-25'
        style={{
          backgroundImage: `radial-gradient(circle farthest-corner at center, ${twConfig.theme.colors.themeSelectOpacity} 0%, ${twConfig.theme.colors.themeBg} 100%)`,
        }}
      >
        {loginView ? (
          <LoginView
            toggleLoginView={toggleLoginView}
            handleLogin={handleLogin}
            handleEmail={handleEmail}
          />
        ) : (
          <RegisterView
            toggleLoginView={toggleLoginView}
            handleLogin={handleLogin}
            email={email}
          />
        )}
      </div>

      <Notification />
    </Layout>
  )
}
