import { useState } from 'react'

import ModalPrimaryBtn from '@/components/shared/Modal/ModalBtn'
import ModalInput from '@/components/shared/Modal/ModalInput'
import { useGlobalContext } from '@/context/globalContext'
import ModalContainer from '@/shared/Modal/ModalContainer'
import ModalForm from '@/shared/Modal/ModalForm'
import ModalInnerContainer from '@/shared/Modal/ModalInnerContainer'

export default function ConfirmModal({ toggle: toggleModal, motionKey }) {
  const { promptState, confirmPrompt } = useGlobalContext()
  const [password, setPassword] = useState('')

  const handleChange = e => {
    setPassword(e.target.value)
  }
  const handleConfirm = () => {
    confirmPrompt({ password })
  }

  return (
    <ModalContainer toggle={toggleModal} motionKey={motionKey} zIndex='z-50'>
      <p className='mt-2'>{promptState.msg}</p>

      <ModalInnerContainer>
        <ModalForm>
          {promptState.passwordRequired ? (
            <ModalInput
              placeholder='verify password'
              id='password'
              type='password'
              value={password}
              onChange={handleChange}
              autoFocus
            />
          ) : (
            <>
              {/* need this due to grid spacing */}
              <div></div>
            </>
          )}

          <ModalPrimaryBtn handleClick={handleConfirm} type='button'>
            Confirm
          </ModalPrimaryBtn>
        </ModalForm>
      </ModalInnerContainer>
    </ModalContainer>
  )
}
