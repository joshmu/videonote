/**
 * @path /src/components/Modals/UserAccountModal/UserAccountModal.tsx
 *
 * @project videonote
 * @file UserAccountModal.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Sunday, 22nd November 2020 6:23:23 pm
 * @copyright © 2020 - 2020 MU
 */

import { ChangeEvent, MouseEvent, useEffect, useState } from 'react'

import { ModalPrimaryBtn } from '@/components/shared/Modal/ModalBtn'
import { useGlobalContext } from '@/context/globalContext'
import { useNotificationContext } from '@/context/notificationContext'
import { ModalContainer } from '@/shared/Modal/ModalContainer'
import { ModalForm } from '@/shared/Modal/ModalForm'
import { ModalHeader } from '@/shared/Modal/ModalHeader'
import { ModalInnerContainer } from '@/shared/Modal/ModalInnerContainer'
import { ModalInput } from '@/shared/Modal/ModalInput'
import { UserInterface } from '@/shared/types'
import { isValidCredentials } from '@/utils/clientHelpers'

export const UserAccountModal = ({
  toggle: toggleModal,
  motionKey,
}: {
  toggle: () => void
  motionKey: string
}) => {
  const { user, updateUser, removeAccount, createPrompt } = useGlobalContext()
  const { addAlert } = useNotificationContext()
  const [userAccountState, setUserAccountState] = useState<
    UserInterface | { username: string; email: string }
  >({
    username: '',
    email: '',
  })

  useEffect(() => {
    if (user)
      setUserAccountState({
        ...userAccountState,
        username: user.username,
        email: user.email,
      })
  }, [user])

  const handleUpdate = (event: MouseEvent<HTMLElement>): void => {
    event.preventDefault()

    if (
      !isValidCredentials({
        username: userAccountState.username,
        email: userAccountState.email,
        passwordRequired: false,
        addAlert,
      })
    )
      return

    createPrompt({
      msg: 'Are you sure you want to update your account?',
      action: () => {
        const name =
          userAccountState.username !== userAccountState.email
            ? userAccountState.username
            : userAccountState.email
        addAlert({ type: 'info', msg: `Updating account: ${name}` })
        console.log('updating account')
        const updateData = {
          username: userAccountState.username,
          email: userAccountState.email,
        }
        updateUser(updateData)
        toggleModal()
      },
    })
  }

  const handleRemoveAccount = (event: MouseEvent<HTMLElement>): void => {
    event.preventDefault()

    createPrompt({
      msg: (
        <span>
          Are you sure you want to permanently delete your account and all data
          associated to{' '}
          <span className='text-themeAccent'>
            {user.username || user.email}
          </span>
          ?
        </span>
      ),
      passwordRequired: true,
      action: ({ password }: { password: string }) => {
        removeAccount({ ...user, password })
        toggleModal()
      },
    })
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setUserAccountState({
      ...userAccountState,
      [event.target.id]: event.target.value,
    })
  }

  return (
    <ModalContainer toggle={toggleModal} motionKey={motionKey}>
      <ModalHeader>Account Settings</ModalHeader>

      <ModalInnerContainer>
        <ModalForm>
          <ModalInput
            value={userAccountState.username}
            onChange={handleChange}
            title='Username'
            id='username'
            type='text'
          />
          <ModalInput
            value={userAccountState.email}
            onChange={handleChange}
            title='Email'
            id='email'
            type='email'
          />

          <div></div>
          <div></div>

          {/* remove account btn */}
          <div className='flex items-center'>
            <ModalPrimaryBtn
              handleClick={handleRemoveAccount}
              type='button'
              color='bg-red-400'
            >
              <span className='italic'>Remove Account</span>
            </ModalPrimaryBtn>
          </div>

          <ModalPrimaryBtn handleClick={handleUpdate}>Update</ModalPrimaryBtn>
        </ModalForm>
      </ModalInnerContainer>
    </ModalContainer>
  )
}
