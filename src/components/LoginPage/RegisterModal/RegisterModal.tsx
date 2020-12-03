/**
 * @path /src/components/LoginPage/RegisterModal/RegisterModal.tsx
 *
 * @project videonote
 * @file RegisterModal.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Thursday, 3rd December 2020 4:32:52 pm
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

type RegisterBodyType = {
  email: string
  password: string
  password2: string
}

export const RegisterModal = ({
  toggleLoginView: toggleLoginRegisterView,
  handleLogin,
  email,
}) => {
  const [user, setUser] = useState<RegisterBodyType>({
    email: '',
    password: '',
    password2: '',
  })
  const { addAlert } = useNotificationContext()

  // if email has been entered accidentally on login page then prefill for register page
  useEffect(() => {
    setUser({ ...user })
  }, [email])

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setUser({ ...user, [event.target.id]: event.target.value })
  }

  const handleSubmit = async (
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    event.preventDefault()

    if (
      !isValidCredentials({
        email: user.email,
        password: user.password,
        password2: user.password2,
        addAlert,
      })
    )
      return

    await handleRegister()
  }

  const handleRegister = async (): Promise<void> => {
    console.log('registering new user')
    const body: RegisterBodyType = {
      email: user.email,
      password: user.password,
      password2: user.password2,
    }
    const { res, data } = await fetcher('/api/register', body)

    if (res.status === StatusCodes.CREATED) {
      addAlert({
        type: 'info',
        msg: 'Account created',
      })
      handleLogin(data)
    } else {
      addAlert({ type: 'error', msg: data.msg })
    }
  }

  const handleToggleLoginRegisterView = (): void => {
    toggleLoginRegisterView(true)
  }

  return (
    <motion.div
      key='register-modal'
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

        <SubHeading>Welcome!</SubHeading>

        <p className='mt-1 text-center text-themeText2'>Create an account</p>

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
          <div className='w-full mt-4'>
            <ModalInput
              type='password'
              id='password2'
              placeholder='Confirm Password'
              aria-label='Password'
              value={user.password2}
              onChange={handleChange}
            />
          </div>

          <div className='flex items-center justify-end mt-4'>
            <ModalPrimaryBtn handleClick={handleSubmit}>
              Register
            </ModalPrimaryBtn>
          </div>
        </form>
      </div>

      <div className='flex items-center justify-center py-4 text-center'>
        <span className='text-sm text-themeText2'>Have an account?</span>

        <button
          onClick={handleToggleLoginRegisterView}
          className='mx-2 text-sm font-bold transition-colors duration-300 ease-in-out focus:outline-none text-themeAccent2 hover:text-themeAccent'
        >
          Sign In
        </button>
      </div>
    </motion.div>
  )
}
