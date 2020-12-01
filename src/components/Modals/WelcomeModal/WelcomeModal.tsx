/**
 * @path /src/components/Modals/WelcomeModal/WelcomeModal.tsx
 *
 * @project videonote
 * @file WelcomeModal.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Saturday, 17th October 2020
 * @modified Tuesday, 1st December 2020 8:02:16 pm
 * @copyright © 2020 - 2020 MU
 */

import { MdSettings as MenuIcon } from 'react-icons/md'

import { ModalContainer } from '@/shared/Modal/ModalContainer'
import { ModalHeader } from '@/shared/Modal/ModalHeader'
import { ModalInnerContainer } from '@/shared/Modal/ModalInnerContainer'
import { Hl } from '@/shared/Text/Text'

export const WelcomeModal = ({
  toggle: toggleModal,
  motionKey,
}: {
  toggle: () => void
  motionKey: string
}) => {
  return (
    <ModalContainer toggle={toggleModal} motionKey={motionKey}>
      <ModalHeader>Welcome to VideoNote</ModalHeader>

      <ModalInnerContainer>
        <p className='mt-2'>
          All actions can be accessed from the{' '}
          <Hl className='font-bold capitalize'>
            Menu <MenuIcon className='inline-block mb-1 text-xl' />
          </Hl>{' '}
          dropdown in the right hand corner of the screen.
        </p>
        <p className='mt-2'>
          Select <Hl className='font-bold capitalize'>Create New</Hl> to start a
          project providing a <Hl>title</Hl> and a <Hl>video url</Hl>.
        </p>
        <p className='mt-2'>
          Once the project has loaded you will then be able to add timestamped
          notes whilst using the <Hl>spacebar</Hl> to <Hl>play/pause</Hl> the
          video. ⚡️
        </p>
        <p className='mt-2'>
          All <Hl>keyboard shortcuts</Hl> are available when the text input area
          is <Hl>empty</Hl>. For further information feel free to refer to the{' '}
          <Hl className='font-bold capitalize'>help</Hl> section.
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
