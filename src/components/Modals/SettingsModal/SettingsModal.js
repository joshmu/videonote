import { useEffect, useState } from 'react'

import { ToggleInput } from '@/components/shared/Toggle/Toggle'
import { useGlobalContext } from '@/context/globalContext'
import { useNotificationContext } from '@/context/notificationContext'
import ModalContainer from '@/shared/Modal/ModalContainer'
import ModalForm from '@/shared/Modal/ModalForm'
import ModalHeader from '@/shared/Modal/ModalHeader'
import ModalInnerContainer from '@/shared/Modal/ModalInnerContainer'
import ModalInput from '@/shared/Modal/ModalInput'
import ModalPrimaryBtn from '@/shared/Modal/ModalPrimaryBtn'

export default function SettingsModal({ toggle: toggleModal, motionKey }) {
  const { settings, updateSettings } = useGlobalContext()
  const { addAlert } = useNotificationContext()

  const [state, setState] = useState({
    playOffset: '',
    seekJump: '',
    showHints: '',
    isPrivate: '',
  })

  useEffect(() => {
    if (settings) setState({ ...state, ...settings })
  }, [settings])

  const handleChangeNum = e => {
    setState({ ...state, [e.target.id]: Number(e.target.value) })
  }

  const handleToggle = id => {
    console.log('toggle', id)
    setState({ ...state, [id]: !settings[id] })
  }

  const handleUpdate = e => {
    e.preventDefault()

    addAlert({ type: 'info', msg: `Updating settings` })
    console.log('updating account')
    updateSettings(state)
    toggleModal()
  }

  return (
    <ModalContainer toggle={toggleModal} motionKey={motionKey}>
      <ModalHeader>Settings</ModalHeader>

      <ModalInnerContainer>
        <ModalForm>
          <ModalInput
            title='Playback Offset (Seconds)'
            id='playOffset'
            type='number'
            value={state.playOffset}
            onChange={handleChangeNum}
          />
          <ModalInput
            title='Seek Jump (Seconds)'
            id='seekJump'
            type='number'
            value={state.seekJump}
            onChange={handleChangeNum}
          />
          <div>
            <ToggleInput
              title='Show Hints'
              state={state.showHints}
              onClick={() => handleToggle('showHints')}
            />
          </div>

          <ModalPrimaryBtn handleClick={handleUpdate}>Update</ModalPrimaryBtn>
        </ModalForm>
      </ModalInnerContainer>
    </ModalContainer>
  )
}
