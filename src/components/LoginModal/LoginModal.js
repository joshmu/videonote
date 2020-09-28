import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useGlobalContext } from '../../context/globalContext'
import { ModalInput, ModalPrimaryBtn } from '../Modals/Modal'

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
          Login or create account
        </p>

        <form>
          <div className='w-full mt-4'>
            <ModalInput
              type='email'
              id='loginEmail'
              placeholder='Email Address'
              aria-label='Email Address'
              value={user.username}
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

          <div className='flex items-center justify-between mt-4'>
            <a href='#' className='text-sm text-gray-600 hover:text-gray-500'>
              Forget Password?
            </a>

            <Link href='/vn' passHref>
              <a>
                <ModalPrimaryBtn
                  onClick={handleLogin}
                  type='button'
                  disabled={user.username.length === 0}
                >
                  Login
                </ModalPrimaryBtn>
              </a>
            </Link>
          </div>
        </form>
      </div>

      <div className='flex items-center justify-center py-4 text-center'>
        <span className='text-sm text-themeText2'>Don't have an account? </span>

        <a
          href='#'
          className='mx-2 text-sm font-bold transition-colors duration-300 ease-in-out text-highlight-700 hover:text-highlight-400'
        >
          Register
        </a>
      </div>
    </motion.div>
  )
}
