import { useGlobalContext } from '@/context/globalContext'
import ModalContainer from '@/shared/Modal/ModalContainer'
import ModalHeader from '@/shared/Modal/ModalHeader'
import ModalInnerContainer from '@/shared/Modal/ModalInnerContainer'

const HelpModal = ({ toggle: toggleModal, motionKey }) => {
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

export default HelpModal
