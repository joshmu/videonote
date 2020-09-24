import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useGlobalContext } from '../../context/globalContext'

export default function LoginModal() {
  const { login } = useGlobalContext()
  const [user, setUser] = useState({ username: '' })

  const handleChange = e => {
    setUser({ ...user, username: e.target.value })
  }
  const handleLogin = () => {
    login(user)
  }

  return (
    <motion.div
      key='login-modal'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='w-full max-w-sm mx-auto overflow-hidden rounded-sm shadow-md bg-gray-50'
    >
      <div className='px-6 py-4'>
        <h2 className='text-3xl font-bold text-center text-highlight-800'>
          VideoNote
        </h2>

        <h3 className='mt-1 text-xl font-medium text-center text-gray-600'>
          Welcome back!
        </h3>

        <p className='mt-1 text-center text-gray-500'>
          Login or create account
        </p>

        <form>
          <div className='w-full mt-4'>
            <input
              className='block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border border-gray-300 rounded-sm focus:border-gray-500 focus:outline-none'
              type='email'
              placeholder='Email Address'
              aria-label='Email Address'
              value={user.username}
              onChange={handleChange}
            />
          </div>

          <div className='w-full mt-4'>
            <input
              className='block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border border-gray-300 rounded-sm focus:border-gray-500 focus:outline-none'
              type='password'
              placeholder='Password'
              aria-label='Password'
            />
          </div>

          <div className='flex items-center justify-between mt-4'>
            <a href='#' className='text-sm text-gray-600 hover:text-gray-500'>
              Forget Password?
            </a>

            <Link href='/vn'>
              <button
                onClick={handleLogin}
                className={`${
                  user.username.length > 0
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-300 pointer-events-none'
                } px-4 py-2 text-white rounded-sm focus:outline-none`}
                type='button'
                disabled={user.username.length === 0}
              >
                Login
              </button>
            </Link>
          </div>
        </form>
      </div>

      <div className='flex items-center justify-center py-4 text-center bg-gray-100'>
        <span className='text-sm text-gray-600'>Don't have an account? </span>

        <a
          href='#'
          className='mx-2 text-sm font-bold transition-colors duration-300 ease-in-out text-highlight-600 hover:text-highlight-500'
        >
          Register
        </a>
      </div>
    </motion.div>
  )
}
