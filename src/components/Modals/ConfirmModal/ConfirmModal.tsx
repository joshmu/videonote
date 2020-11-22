/**
 * @path /src/components/Modals/ConfirmModal/ConfirmModal.tsx
 *
 * @project videonote
 * @file ConfirmModal.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Friday, 16th October 2020
 * @modified Sunday, 22nd November 2020 5:06:01 pm
 * @copyright © 2020 - 2020 MU
 */

import { ChangeEvent, useState } from 'react'

import { ModalPrimaryBtn } from '@/components/shared/Modal/ModalBtn'
import { ModalInput } from '@/components/shared/Modal/ModalInput'
import { useGlobalContext } from '@/context/globalContext'
import { ModalContainer } from '@/shared/Modal/ModalContainer'
import { ModalForm } from '@/shared/Modal/ModalForm'
import { ModalInnerContainer } from '@/shared/Modal/ModalInnerContainer'

export const ConfirmModal = ({
  toggle: toggleModal,
  motionKey,
}: {
  toggle: () => void
  motionKey: string
}) => {
  const { promptState, confirmPrompt } = useGlobalContext()
  const [password, setPassword] = useState<string>('')

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value)
  }
  const handleConfirm = (): void => {
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
              autoFocus={true}
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
