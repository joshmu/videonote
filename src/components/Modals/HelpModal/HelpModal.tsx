/**
 * @path /src/components/Modals/HelpModal/HelpModal.tsx
 *
 * @project videonote
 * @file HelpModal.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 12th October 2020
 * @modified Sunday, 22nd November 2020 5:24:25 pm
 * @copyright © 2020 - 2020 MU
 */

import { useGlobalContext } from '@/context/globalContext'
import { ModalContainer } from '@/shared/Modal/ModalContainer'
import { ModalHeader } from '@/shared/Modal/ModalHeader'
import { ModalInnerContainer } from '@/shared/Modal/ModalInnerContainer'

export const HelpModal = ({
  toggle: toggleModal,
  motionKey,
}: {
  toggle: () => void
  motionKey: string
}) => {
  const { HINTS } = useGlobalContext()

  return (
    <ModalContainer toggle={toggleModal} motionKey={motionKey}>
      <ModalHeader>Cheatsheet</ModalHeader>

      <ModalInnerContainer>
        {HINTS.map((hint, idx) => (
          <p key={idx} className='mb-2'>
            - {hint}
          </p>
        ))}
      </ModalInnerContainer>
    </ModalContainer>
  )
}
