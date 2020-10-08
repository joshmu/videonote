import { useEffect, useState } from 'react'
import { useGlobalContext } from '../../context/globalContext'
import {
  ModalContainer,
  ModalHeader,
  ModalForm,
  ModalInput,
  ModalInnerContainer,
  ModalPrimaryBtn,
} from './Modal'
import { ToggleInput } from '../shared/Toggle'
import { useNotificationContext } from '../../context/notificationContext'

export default function SettingsModal({ toggle: toggleModal, motionKey }) {
  const { settings, updateSettings } = useGlobalContext()
  const { addAlert } = useNotificationContext()

  const [state, setState] = useState({
    playOffset: '',
    seekJump: '',
    showHints: '',
    private: '',
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

          <ModalPrimaryBtn onClick={handleUpdate}>Update</ModalPrimaryBtn>
        </ModalForm>
      </ModalInnerContainer>
    </ModalContainer>
  )
}
