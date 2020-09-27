import { useGlobalContext } from '../../context/globalContext'
import { ModalContainer, ModalHeader, ModalForm, ModalInput } from './Modal'

export default function SettingsModal({ toggle: toggleModal }) {
  const { settings, updateSettings } = useGlobalContext()

  const handleChange = e => {
    if (e.target.id === 'offset')
      return updateSettings({ playOffset: Number(e.target.value) })
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
      </ModalForm>
    </ModalContainer>
  )
}
