import ModalContainer from '@/shared/Modal/ModalContainer'
import ModalHeader from '@/shared/Modal/ModalHeader'
import ModalInnerContainer from '@/shared/Modal/ModalInnerContainer'
import { MdSettings as SettingsIcon } from 'react-icons/md'

const WelcomeModal = ({ toggle: toggleModal, motionKey }) => {
  return (
    <ModalContainer toggle={toggleModal} motionKey={motionKey}>
      <ModalHeader>Welcome!</ModalHeader>

      <ModalInnerContainer>
        <p className='mt-2'>
          All actions can be accessed from the{' '}
          <span className='capitalize text-themeAccent'>
            settings <SettingsIcon className='inline-block mb-1 text-xl' />
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

export default WelcomeModal
