import {
  ModalContainer,
  ModalForm,
  ModalHeader,
  ModalInput,
  ModalPrimaryBtn,
} from './Modal'

export default function AccountModal({ toggle: toggleModal }) {
  const handleUpdate = () => {
    console.log('updating account')
    toggleModal()
  }

  return (
    <ModalContainer toggle={toggleModal}>
      <ModalHeader>Account Settings</ModalHeader>

      <ModalForm>
        <ModalInput title='Username' id='username' type='text' />
        <ModalInput title='Email' id='email' type='email' />
        <ModalInput title='Password' id='password' type='password' />
        <ModalInput
          title='Password Confirmation'
          id='passwordConfirmation'
          type='password'
        />
      </ModalForm>
      <ModalPrimaryBtn onClick={handleUpdate}>Update</ModalPrimaryBtn>
    </ModalContainer>
  )
}
