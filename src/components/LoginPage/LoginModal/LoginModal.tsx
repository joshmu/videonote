/**
 * @path /src/components/LoginPage/LoginModal/LoginModal.tsx
 *
 * @project videonote
 * @file LoginModal.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Friday, 4th December 2020 1:34:55 pm
 * @copyright © 2020 - 2020 MU
 */

import { motion } from 'framer-motion'
import { StatusCodes } from 'http-status-codes'
import Link from 'next/link'
import { ChangeEvent, useEffect, useState } from 'react'

import { ModalPrimaryBtn } from '@/components/shared/Modal/ModalBtn'
import { useNotificationContext } from '@/context/notificationContext'
import { ModalInput } from '@/shared/Modal/ModalInput'
import { Heading2, SubHeading } from '@/shared/Text/Text'
import { isValidCredentials } from '@/utils/clientHelpers'
import { fetcher } from '@/utils/clientHelpers'

type LoginBodyType = {
  email: string
  password: string
}

export const LoginModal = ({
  toggleLoginView: toggleLoginRegisterModal,
  handleLogin,
  handleEmail,
}) => {
  const { addAlert } = useNotificationContext()
  const [user, setUser] = useState<LoginBodyType>({
    email: '',
    password: '',
  })

  // passing back email input to global page for autofill on register page if need be
  useEffect(() => {
    handleEmail(user.email)
  }, [user.email])

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setUser({ ...user, [event.target.id]: event.target.value })
  }

  const handleSubmit = (event: ChangeEvent<HTMLInputElement>): void => {
    event.preventDefault()

    if (
      !isValidCredentials({
        email: user.email,
        password: user.password,
        addAlert,
      })
    )
      return

    requestLogin()
  }

  const requestLogin = async (): Promise<void> => {
    console.log('logging in user')

    addAlert({
      type: 'info',
      msg: `Logging in...`,
    })

    const body: LoginBodyType = {
      email: user.email,
      password: user.password,
    }
    const { res, data } = await fetcher('/api/login', body)

    // if we haven't found the account
    if (res.status !== StatusCodes.MOVED_TEMPORARILY) {
      addAlert({ type: 'error', msg: data.msg })
      return
    }

    // continue to app
    handleLogin(data)
  }

  const handleToggleLoginRegisterModal = (): void => {
    toggleLoginRegisterModal(false)
  }

  return (
    <motion.div
      key='login-modal'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='w-full max-w-sm mx-auto overflow-hidden border rounded-sm border-themeText bg-themeBg'
    >
      <div className='px-6 py-4'>
        <Link href='/hello' passHref>
          <a>
            <Heading2 className='text-center'>VideoNote</Heading2>
          </a>
        </Link>

        <SubHeading className='text-center'>Welcome back!</SubHeading>

        <p className='mt-1 text-center text-themeText2'>
          Sign in to your account
        </p>

        <form>
          <div className='w-full mt-4'>
            <ModalInput
              type='email'
              id='email'
              placeholder='Email Address'
              aria-label='Email Address'
              value={user.email}
              onChange={handleChange}
              autoFocus
            />
          </div>

          <div className='w-full mt-4'>
            <ModalInput
              type='password'
              id='password'
              placeholder='Password'
              aria-label='Password'
              value={user.password}
              onChange={handleChange}
            />
          </div>

          <div className='flex items-center justify-end mt-4'>
            <ModalPrimaryBtn handleClick={handleSubmit}>Login</ModalPrimaryBtn>
          </div>
        </form>
      </div>

      <div className='flex items-center justify-center py-4 text-center'>
        <span className='text-sm text-themeText2'>Don't have an account? </span>

        <button
          onClick={handleToggleLoginRegisterModal}
          className='mx-2 text-sm font-bold transition-colors duration-300 ease-in-out focus:outline-none text-themeAccent2 hover:text-themeAccent'
        >
          Register
        </button>
      </div>
    </motion.div>
  )
}
