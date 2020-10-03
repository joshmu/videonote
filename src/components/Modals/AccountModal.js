import { useState, useEffect } from 'react'
import { useGlobalContext } from '../../context/globalContext'
import {
  ModalContainer,
  ModalForm,
  ModalHeader,
  ModalInput,
  ModalPrimaryBtn,
} from './Modal'
import { useNotificationContext } from '../../context/notificationContext'
import { isValidCredentials } from '../../../utils/clientHelpers'

export default function AccountModal({ toggle: toggleModal }) {
  const { account } = useGlobalContext()
  const { addAlert } = useNotificationContext()
  const [state, setState] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  })

  useEffect(() => {
    if (account)
      setState({ ...state, username: account.username, email: account.email })
  }, [account])

  const handleUpdate = e => {
    e.preventDefault()

    if (!isValidCredentials({ ...state }))
      return addAlert({ type: 'error', msg: 'Invalid credentials provided' })

    addAlert({ type: 'success', msg: `Updating account: ${state.email}` })
    console.log('updating account')
    toggleModal()
  }

  const handleChange = e => {
    setState({ ...state, [e.target.id]: e.target.value })
  }

  return (
    <ModalContainer toggle={toggleModal}>
      <ModalHeader>Account Settings</ModalHeader>

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
        <ModalInput
          value={state.passwordConfirmation}
          onChange={handleChange}
          title='Password Confirmation'
          id='passwordConfirmation'
          type='password'
        />
      </ModalForm>
      <ModalPrimaryBtn onClick={handleUpdate} type='submit'>
        Update
      </ModalPrimaryBtn>
    </ModalContainer>
  )
}
