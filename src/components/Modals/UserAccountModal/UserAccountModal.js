import { useEffect, useState } from 'react'

import ModalPrimaryBtn from '@/components/shared/Modal/ModalBtn'
import { useGlobalContext } from '@/context/globalContext'
import { useNotificationContext } from '@/context/notificationContext'
import ModalContainer from '@/shared/Modal/ModalContainer'
import ModalForm from '@/shared/Modal/ModalForm'
import ModalHeader from '@/shared/Modal/ModalHeader'
import ModalInnerContainer from '@/shared/Modal/ModalInnerContainer'
import ModalInput from '@/shared/Modal/ModalInput'
import { isValidCredentials } from '@/utils/clientHelpers'

export default function UserAccountModal({ toggle: toggleModal, motionKey }) {
  const { user, updateUser, removeAccount, prompt } = useGlobalContext()
  const { addAlert } = useNotificationContext()
  const [state, setState] = useState({
    username: '',
    email: '',
  })

  useEffect(() => {
    if (user) setState({ ...state, username: user.username, email: user.email })
  }, [user])

  const handleUpdate = e => {
    e.preventDefault()

    if (
      !isValidCredentials({
        username: state.username,
        email: state.email,
        passwordRequired: false,
        addAlert,
      })
    )
      return

    prompt({
      msg: 'Are you sure you want to update your account?',
      action: () => {
        const name =
          state.username !== state.email ? state.username : state.email
        addAlert({ type: 'info', msg: `Updating account: ${name}` })
        console.log('updating account')
        const updateData = {
          username: state.username,
          email: state.email,
        }
        updateUser(updateData)
        toggleModal()
      },
    })
  }

  const handleRemoveAccount = e => {
    e.preventDefault()

    prompt({
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
      action: data => {
        removeAccount({ ...user, ...data })
        toggleModal()
      },
    })
  }

  const handleChange = e => {
    setState({ ...state, [e.target.id]: e.target.value })
  }

  return (
    <ModalContainer toggle={toggleModal} motionKey={motionKey}>
      <ModalHeader>Account Settings</ModalHeader>

      <ModalInnerContainer>
        <ModalForm>
          <ModalInput
            value={state.username}
            onChange={handleChange}
            title='Username'
            id='username'
            type='text'
          />
          <ModalInput
            value={state.email}
            onChange={handleChange}
            title='Email'
            id='email'
            type='email'
          />
          {/* <ModalInput
            value={state.password}
            onChange={handleChange}
            title='Confirm Password'
            id='password'
            type='password'
          /> */}

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
