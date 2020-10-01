import { useState } from 'react'
import { motion } from 'framer-motion'
import Router from 'next/router'
import { useGlobalContext } from '../../context/globalContext'
import { ModalInput, ModalPrimaryBtn } from '../Modals/Modal'
import { useNotificationContext } from '../../context/notificationContext'
import isEmail from 'validator/lib/isEmail'

export default function Login({ toggleLoginView }) {
  const { login } = useGlobalContext()
  const [user, setUser] = useState({ loginEmail: '', loginPassword: '' })
  const { addAlert } = useNotificationContext()

  const handleChange = e => {
    setUser({ ...user, [e.target.id]: e.target.value })
  }

  const isValidCredentials = () => {
    const validEmail = isEmail(user.loginEmail)
    const validPassword = user.loginPassword.length > 4
    return validEmail && validPassword
  }
  const handleSubmit = () => {
    if (!isValidCredentials())
      return addAlert({ type: 'error', msg: 'Invalid credentials provided' })

    login(user)
    Router.push('/vn')
  }
  const handleSwitchView = () => {
    toggleLoginView(false)
  }

  return (
    <motion.div
      key='login-modal'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='w-full max-w-sm mx-auto overflow-hidden border rounded-sm border-themeText'
    >
      <div className='px-6 py-4'>
        <h2 className='text-3xl font-bold text-center text-highlight-400'>
          VideoNote
        </h2>

        <h3 className='mt-1 text-xl font-medium text-center text-themeText'>
          Welcome back!
        </h3>

        <p className='mt-1 text-center text-themeText2'>
          Sign in to your account
        </p>

        <form>
          <div className='w-full mt-4'>
            <ModalInput
              type='email'
              id='loginEmail'
              placeholder='Email Address'
              aria-label='Email Address'
              value={user.loginEmail}
              onChange={handleChange}
            />
          </div>

          <div className='w-full mt-4'>
            <ModalInput
              type='password'
              id='loginPassword'
              placeholder='Password'
              aria-label='Password'
            />
          </div>

          <div className='flex items-center justify-end mt-4'>
            <ModalPrimaryBtn onClick={handleSubmit} type='button'>
              Login
            </ModalPrimaryBtn>
          </div>
        </form>
      </div>

      <div className='flex items-center justify-center py-4 text-center'>
        <span className='text-sm text-themeText2'>Don't have an account? </span>

        <button
          onClick={handleSwitchView}
          className='mx-2 text-sm font-bold transition-colors duration-300 ease-in-out focus:outline-none text-highlight-700 hover:text-highlight-400'
        >
          Register
        </button>
      </div>
    </motion.div>
  )
}