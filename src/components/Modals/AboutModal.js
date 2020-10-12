import { ModalContainer, ModalHeader, ModalInnerContainer } from './Modal'

export default function AboutModal({ toggle: toggleModal, motionKey }) {
  return (
    <ModalContainer toggle={toggleModal} motionKey={motionKey}>
      <ModalHeader>About VideoNote</ModalHeader>

      <ModalInnerContainer>
        <p>
          VideoNote aims to provide the fastest possible workflow to review
          video content. Utilising a variety of intuitive keyboard shortcuts,
          seamless sharing of projects with others and an unopinionated design
          to keep you focused on what matters most.
        </p>
        <p className='mt-2'>
          We are currently in a beta development stage. If you have feature
          requests or any feedback then the VideoNote team would love to hear
          from you.
        </p>
        <div className='w-full mt-2 text-right'>
          <a
            href='mailto:hello@videonote.app'
            className='cursor-pointer text-highlight-400 text-md'
          >
            hello@videonote.app
          </a>
        </div>
      </ModalInnerContainer>
    </ModalContainer>
  )
}
