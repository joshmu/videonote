/**
 * @path /src/components/Modals/WelcomeModal/WelcomeModal.tsx
 *
 * @project videonote
 * @file WelcomeModal.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Saturday, 17th October 2020
 * @modified Sunday, 22nd November 2020 6:24:24 pm
 * @copyright © 2020 - 2020 MU
 */

import { MdSettings as MenuIcon } from 'react-icons/md'

import { ModalContainer } from '@/shared/Modal/ModalContainer'
import { ModalHeader } from '@/shared/Modal/ModalHeader'
import { ModalInnerContainer } from '@/shared/Modal/ModalInnerContainer'

export const WelcomeModal = ({
  toggle: toggleModal,
  motionKey,
}: {
  toggle: () => void
  motionKey: string
}) => {
  return (
    <ModalContainer toggle={toggleModal} motionKey={motionKey}>
      <ModalHeader>Welcome!</ModalHeader>

      <ModalInnerContainer>
        <p className='mt-2'>
          All actions can be accessed from the{' '}
          <span className='capitalize text-themeAccent'>
            menu <MenuIcon className='inline-block mb-1 text-xl' />
          </span>{' '}
          dropdown in the right hand corner of the screen.
        </p>
        <p className='mt-2'>
          Select <span className='capitalize text-themeAccent'>Create New</span>{' '}
          to create a new project providing a{' '}
          <span className='text-themeAccent'>title</span> and a{' '}
          <span className='text-themeAccent'>video url</span>.
        </p>
        <p className='mt-2'>
          Once the project has loaded you will then be able to add timestamped
          notes whilst using the{' '}
          <span className='capitalize text-themeAccent'>spacebar</span> to{' '}
          <span className='text-themeAccent'>play/pause</span> the video if you
          choose.
        </p>
        <p className='mt-2'>
          For further information feel free to check the{' '}
          <span className='capitalize text-themeAccent'>help</span> section in
          the settings dropdown.
        </p>
        <p className='mt-2'>
          We are currently in our beta development stage. If you have feature
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
