/**
 * @path /src/components/Modals/AboutModal/AboutModal.tsx
 *
 * @project videonote
 * @file AboutModal.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 12th October 2020
 * @modified Tuesday, 1st December 2020 8:03:11 pm
 * @copyright © 2020 - 2020 MU
 */

import { ModalContainer } from '@/shared/Modal/ModalContainer'
import { ModalHeader } from '@/shared/Modal/ModalHeader'
import { ModalInnerContainer } from '@/shared/Modal/ModalInnerContainer'
import { Hl } from '@/shared/Text/Text'

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
          <Hl className='font-bold'>VideoNote</Hl> aims to provide the fastest
          possible workflow to review video content. Utilising a variety of
          intuitive keyboard shortcuts, seamless sharing of projects with a
          minimal design to keep you focused on what matters most.
        </p>
        <p className='mt-2'>
          <Hl className='font-bold'>VideoNote</Hl> is currently in beta stage
          development, so things will be evolving and you may find a bug 🐛. If
          so let us know, or tell us how we can make your experience even
          better! ✨
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
