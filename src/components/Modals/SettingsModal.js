import { useGlobalContext } from '../../context/globalContext'
import {
  ModalContainer,
  ModalHeader,
  ModalForm,
  ModalInput,
  ModalInnerContainer,
} from './Modal'
import { ToggleInput } from '../shared/Toggle'

export default function SettingsModal({ toggle: toggleModal }) {
  const { settings, updateSettings } = useGlobalContext()

  const handleChangeNum = e => {
    updateSettings({ [e.target.id]: Number(e.target.value) })
  }

  const handleToggle = id => {
    console.log('toggle', id)
    updateSettings({ [id]: !settings[id] })
  }

  return (
    <ModalContainer toggle={toggleModal}>
      <ModalHeader>Settings</ModalHeader>

      <ModalInnerContainer>
        <ModalForm>
          <ModalInput
            title='Playback Offset (Seconds)'
            id='playOffset'
            type='number'
            value={settings.playOffset}
            onChange={handleChangeNum}
          />
          <ModalInput
            title='Seek Jump (Seconds)'
            id='seekJump'
            type='number'
            value={settings.seekJump}
            onChange={handleChangeNum}
          />
          <div>
            <ToggleInput
              title='Show Hints'
              state={settings.showHints}
              onClick={() => handleToggle('showHints')}
            />
          </div>
        </ModalForm>
      </ModalInnerContainer>
    </ModalContainer>
  )
}
