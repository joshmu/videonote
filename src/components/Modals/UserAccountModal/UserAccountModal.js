import { useEffect, useState } from 'react'

import { useGlobalContext } from '@/context/globalContext'
import { useNotificationContext } from '@/context/notificationContext'
import ModalContainer from '@/shared/Modal/ModalContainer'
import ModalForm from '@/shared/Modal/ModalForm'
import ModalHeader from '@/shared/Modal/ModalHeader'
import ModalInnerContainer from '@/shared/Modal/ModalInnerContainer'
import ModalInput from '@/shared/Modal/ModalInput'
import ModalPrimaryBtn from '@/shared/Modal/ModalPrimaryBtn'
import { isValidCredentials } from '@/utils/clientHelpers'

export default function UserAccountModal({ toggle: toggleModal, motionKey }) {
  const { user, updateUser } = useGlobalContext()
  const { addAlert } = useNotificationContext()
  const [state, setState] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  })

  useEffect(() => {
    if (user) setState({ ...state, username: user.username, email: user.email })
  }, [user])

  const handleUpdate = e => {
    e.preventDefault()

    if (!isValidCredentials({ ...state }))
      return addAlert({ type: 'error', msg: 'Invalid credentials provided' })

    const name = state.username !== state.email ? state.username : state.email
    addAlert({ type: 'info', msg: `Updating account: ${name}` })
    console.log('updating account')
    const updateData = {
      username: state.username,
      email: state.email,
    }
    updateUser(updateData)
    toggleModal()
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
          <ModalInput
            value={state.password}
            onChange={handleChange}
            title='Password'
            id='password'
            type='password'
          />
          {/* <ModalInput
            value={state.passwordConfirmation}
            onChange={handleChange}
            title='Password Confirmation'
            id='passwordConfirmation'
            type='password'
          /> */}
          <div></div>
          <div></div>

          <ModalPrimaryBtn onClick={handleUpdate} type='submit'>
            Update
          </ModalPrimaryBtn>
        </ModalForm>
      </ModalInnerContainer>
    </ModalContainer>
  )
}
