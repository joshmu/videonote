import { useEffect, useState } from 'react'

import ModalPrimaryBtn from '@/components/shared/Modal/ModalBtn'
import { ToggleInput } from '@/components/shared/Toggle/Toggle'
import { useGlobalContext } from '@/context/globalContext'
import { useNotificationContext } from '@/context/notificationContext'
import ModalContainer from '@/shared/Modal/ModalContainer'
import ModalForm from '@/shared/Modal/ModalForm'
import ModalHeader from '@/shared/Modal/ModalHeader'
import ModalInnerContainer from '@/shared/Modal/ModalInnerContainer'
import ModalInput from '@/shared/Modal/ModalInput'

import VolumeSlider from './VolumeSlider/VolumeSlider'

export default function SettingsModal({ toggle: toggleModal, motionKey }) {
  const { settings, updateSettings, SETTINGS_DEFAULTS } = useGlobalContext()
  const { addAlert } = useNotificationContext()

  const [state, setState] = useState({ ...SETTINGS_DEFAULTS })

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
            title='Playback Offset (seconds)'
            id='playOffset'
            value={state.playOffset}
            onChange={handleChangeNum}
            type='number'
            max='0'
          />
          <ModalInput
            title='Seek Jump (seconds)'
            id='seekJump'
            value={state.seekJump}
            onChange={handleChangeNum}
            type='number'
            min='1'
          />
          <VolumeSlider />
          <ModalInput
            title='List Sidebar Width (px)'
            id='sidebarWidth'
            value={state.sidebarWidth}
            onChange={handleChangeNum}
            type='number'
            min='50'
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
