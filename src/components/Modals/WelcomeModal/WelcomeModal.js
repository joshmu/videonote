import ModalContainer from '@/shared/Modal/ModalContainer'
import ModalHeader from '@/shared/Modal/ModalHeader'
import ModalInnerContainer from '@/shared/Modal/ModalInnerContainer'
import { MdSettings as SettingsIcon } from 'react-icons/md'

const WelcomeModal = ({ toggle: toggleModal, motionKey }) => {
  return (
    <ModalContainer toggle={toggleModal} motionKey={motionKey}>
      <ModalHeader>Welcome!</ModalHeader>

      <ModalInnerContainer>
        <p>
          <span className='font-semibold text-themeAccent'>VideoNote</span> aims
          to provide the fastest possible workflow to review video content.
          Utilising a variety of intuitive keyboard shortcuts, seamless sharing
          of projects with a minimal design to keep you focused on what matters
          most.
        </p>
        <p className='mt-2'>
          All app actions can be accessed from the{' '}
          <span className='capitalize text-themeAccent'>
            settings <SettingsIcon className='inline-block mb-1 text-xl' />
          </span>{' '}
          dropdown by clicking cog icon in the right hand corner of the screen.
        </p>
        <p className='mt-2'>
          Select <span className='capitalize text-themeAccent'>Create New</span>{' '}
          to create a new project providing a title and url address of your
          video.
        </p>
        <p className='mt-2'>
          Once the project has loaded you will then be able to add timestamped
          notes whilst using the{' '}
          <span className='capitalize text-themeAccent'>spacebar</span> to{' '}
          <span className='capitalize text-themeAccent'>play/pause</span> the
          video if you choose.
        </p>
        <p className='mt-2'>
          For further information feel free to check the{' '}
          <span className='capitalize text-themeAccent'>help</span> section in
          the settings dropdown.
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

export default WelcomeModal
