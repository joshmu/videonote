/**
 * @path /pages/login.tsx
 *
 * @project videonote
 * @file login.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Sunday, 1st May 2022 11:01:29 am
 * @copyright © 2020 - 2020 MU
 */

import { NextPage } from 'next'
import Router from 'next/router'
import { useState } from 'react'

import { Layout } from '@/components/Layout/Layout'
import { LoginModal } from '@/components/LoginPage/LoginModal/LoginModal'
import { RegisterModal } from '@/components/LoginPage/RegisterModal/RegisterModal'
import { Notification } from '@/components/Notification/Notification'
import { ThemeToggle } from '@/components/shared/ThemeToggle/ThemeToggle'
import useTwConfig from '@/hooks/useTwConfig'

import { handleJwtToken } from '../utils/clientHelpers'
import { LoginUniversalModal } from '../src/components/LoginPage/LoginModal/LoginUniversalModal'

const Login: NextPage = () => {
  const [loginView, setLoginView] = useState<boolean>(true)
  const [email, setEmail] = useState<string>('')

  const twConfig = useTwConfig()

  const toggleLoginView = (state: boolean = undefined): void => {
    const isLoginViewShowing = state === undefined ? !loginView : state
    setLoginView(isLoginViewShowing)
  }

  const handleLogin = (data: { token: string }): void => {
    handleJwtToken(data.token)
    Router.push('/')
  }

  const handleEmail = (email: string): void => setEmail(email)

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
          <LoginUniversalModal
            toggleLoginView={toggleLoginView}
            handleLogin={handleLogin}
            handleEmail={handleEmail}
          />
        ) : (
          <RegisterModal
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

export default Login
