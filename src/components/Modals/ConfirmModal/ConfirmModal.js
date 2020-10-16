import ModalPrimaryBtn from '@/components/shared/Modal/ModalBtn'
import { useGlobalContext } from '@/context/globalContext'
import ModalContainer from '@/shared/Modal/ModalContainer'
import ModalForm from '@/shared/Modal/ModalForm'
import ModalHeader from '@/shared/Modal/ModalHeader'
import ModalInnerContainer from '@/shared/Modal/ModalInnerContainer'

export default function ConfirmModal({ toggle: toggleModal, motionKey }) {
  const { confirmation, confirmationConfirm } = useGlobalContext()

  const handleConfirm = () => {
    confirmationConfirm()
  }

  return (
    <ModalContainer toggle={toggleModal} motionKey={motionKey} zIndex='z-50'>
      {confirmation.msg}

      <ModalInnerContainer>
        <ModalForm>
          {/* <ModalPrimaryBtn
            handleClick={toggleModal}
            type='button'
            color='bg-orange-400'
          >
            Cancel
          </ModalPrimaryBtn> */}
          <div></div>
          <ModalPrimaryBtn handleClick={handleConfirm} type='button'>
            Confirm
          </ModalPrimaryBtn>
        </ModalForm>
      </ModalInnerContainer>
    </ModalContainer>
  )
}
