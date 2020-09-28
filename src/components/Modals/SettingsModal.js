import { useGlobalContext } from '../../context/globalContext'
import { ModalContainer, ModalHeader, ModalForm, ModalInput } from './Modal'
import { Toggle, ToggleInput } from '../shared/Toggle'

export default function SettingsModal({ toggle: toggleModal }) {
  const { settings, updateSettings } = useGlobalContext()

  const handleChange = e => {
    if (e.target.id === 'offset')
      return updateSettings({ playOffset: Number(e.target.value) })
  }

  const handleToggle = id => {
    console.log('toggle', id)
    updateSettings({ [id]: !settings[id] })
  }

  return (
    <ModalContainer toggle={toggleModal}>
      <ModalHeader>Settings</ModalHeader>

      <ModalForm>
        <ModalInput
          title='Playback Offset (Seconds)'
          id='offset'
          type='number'
          value={settings.playOffset}
          onChange={handleChange}
        />
        <div>
          <ToggleInput
            title='Show Hints'
            state={settings.showHints}
            onClick={() => handleToggle('showHints')}
          />
        </div>
      </ModalForm>
    </ModalContainer>
  )
}
