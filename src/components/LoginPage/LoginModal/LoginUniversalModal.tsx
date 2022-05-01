/**
 * @path /src/components/LoginPage/LoginModal/LoginUniversalModal.tsx
 *
 * @project videonote
 * @file LoginUniversalModal.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Sunday, 1st May 2022 11:17:21 am
 * @copyright © 2020 - 2020 MU
 */

import { motion } from 'framer-motion'
import Link from 'next/link'

import { ModalPrimaryBtn } from '@/components/shared/Modal/ModalBtn'
import { Heading2, SubHeading } from '@/shared/Text/Text'

export const LoginUniversalModal = ({
  toggleLoginView: toggleLoginRegisterModal,
  handleLogin,
  handleEmail,
}) => {
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

        <div className='flex justify-center'>
          <ModalPrimaryBtn handleClick={() => {}}>
            <a href='/api/auth/login'>Log In</a>
          </ModalPrimaryBtn>
        </div>
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
