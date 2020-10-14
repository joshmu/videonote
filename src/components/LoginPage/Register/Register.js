import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import isEmail from 'validator/lib/isEmail'

import { useNotificationContext } from '@/context/notificationContext'
import ModalInput from '@/shared/Modal/ModalInput'
import ModalPrimaryBtn from '@/shared/Modal/ModalPrimaryBtn'
import { fetcher } from '@/utils/clientHelpers'

export default function Register({ toggleLoginView, handleLogin, email }) {
  const [user, setUser] = useState({
    registerEmail: '',
    registerPassword: '',
    registerPassword2: '',
  })
  const { addAlert } = useNotificationContext()

  // if email has been entered accidentally on login page then prefill for register page
  useEffect(() => {
    setUser({ ...user, registerEmail: email })
  }, [email])

  const handleChange = e => {
    setUser({ ...user, [e.target.id]: e.target.value })
  }

  const handleSubmit = async e => {
    e.preventDefault()

    if (!isValidCredentials())
      return addAlert({ type: 'error', msg: 'Invalid credentials provided' })
    await handleRegister()
  }
  const handleRegister = async () => {
    console.log('registering new user')
    const body = {
      email: user.registerEmail,
      password: user.registerPassword2,
    }
    const { res, data } = await fetcher('/api/register', body)

    // 201 = created
    if (res.status === 201) {
      addAlert({
        type: 'info',
        msg: 'Account created',
        duration: 1000,
      })
      handleLogin(data)
    } else {
      addAlert({ type: 'error', msg: data.msg })
    }
  }
  const isValidCredentials = () => {
    const validEmail = isEmail(user.registerEmail)
    const validPassword =
      user.registerPassword.length > 4 &&
      user.registerPassword === user.registerPassword2
    return validEmail && validPassword
  }
  const handleSwitchView = () => {
    toggleLoginView(true)
  }

  return (
    <motion.div
      key='register-modal'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='w-full max-w-sm mx-auto overflow-hidden border rounded-sm border-themeText'
    >
      <div className='px-6 py-4'>
        <Link href='/hello' passHref>
          <a>
            <h2 className='text-3xl font-bold text-center text-themeAccent'>
              VideoNote
            </h2>
          </a>
        </Link>

        <h3 className='mt-1 text-xl font-medium text-center text-themeText'>
          Welcome!
        </h3>

        <p className='mt-1 text-center text-themeText2'>Create an account</p>

        <form>
          <div className='w-full mt-4'>
            <ModalInput
              type='email'
              id='registerEmail'
              placeholder='Email Address'
              aria-label='Email Address'
              value={user.registerEmail}
              onChange={handleChange}
              autoFocus
            />
          </div>

          <div className='w-full mt-4'>
            <ModalInput
              type='password'
              id='registerPassword'
              placeholder='Password'
              aria-label='Password'
              value={user.registerPassword}
              onChange={handleChange}
            />
          </div>
          <div className='w-full mt-4'>
            <ModalInput
              type='password'
              id='registerPassword2'
              placeholder='Confirm Password'
              aria-label='Password'
              value={user.registerPassword2}
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
          onClick={handleSwitchView}
          className='mx-2 text-sm font-bold transition-colors duration-300 ease-in-out focus:outline-none text-themeAccent2 hover:text-themeAccent'
        >
          Sign In
        </button>
      </div>
    </motion.div>
  )
}
