/**
 * @path /src/components/Modals/AboutModal/AboutModal.tsx
 *
 * @project videonote
 * @file AboutModal.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 12th October 2020
 * @modified Sunday, 22nd November 2020 4:44:11 pm
 * @copyright © 2020 - 2020 MU
 */

import { ModalContainer } from '@/shared/Modal/ModalContainer'
import { ModalHeader } from '@/shared/Modal/ModalHeader'
import { ModalInnerContainer } from '@/shared/Modal/ModalInnerContainer'

export const AboutModal = ({
  toggle: toggleModal,
  motionKey,
}: {
  toggle: () => void
  motionKey: string
}) => {
  return (
    <ModalContainer toggle={toggleModal} motionKey={motionKey}>
      <ModalHeader>About VideoNote</ModalHeader>

      <ModalInnerContainer>
        <p>
          <span className='font-semibold text-themeAccent'>VideoNote</span> aims
          to provide the fastest possible workflow to review video content.
          Utilising a variety of intuitive keyboard shortcuts, seamless sharing
          of projects with a minimal design to keep you focused on what matters
          most.
        </p>
        <p className='mt-2'>
          We are currently in a beta development stage. If you have feature
          requests or any feedback then the VideoNote team would love to hear
          from you.
        </p>
        <div className='w-full mt-2 text-right'>
          <a
            href='mailto:hello@videonote.app'
            className='cursor-pointer text-themeAccent text-md'
          >
            hello@videonote.app
          </a>
        </div>
      </ModalInnerContainer>
    </ModalContainer>
  )
}
