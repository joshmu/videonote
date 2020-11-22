/**
 * @path /src/components/Modals/SettingsModal/SettingsModal.tsx
 *
 * @project videonote
 * @file SettingsModal.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Thursday, 24th September 2020
 * @modified Sunday, 22nd November 2020 5:40:05 pm
 * @copyright © 2020 - 2020 MU
 */

import { ChangeEvent, useEffect, useState } from 'react'

import { ModalPrimaryBtn } from '@/components/shared/Modal/ModalBtn'
import { ToggleInput } from '@/components/shared/Toggle/Toggle'
import { useGlobalContext } from '@/context/globalContext'
import { useNotificationContext } from '@/context/notificationContext'
import { ModalContainer } from '@/shared/Modal/ModalContainer'
import { ModalForm } from '@/shared/Modal/ModalForm'
import { ModalHeader } from '@/shared/Modal/ModalHeader'
import { ModalInnerContainer } from '@/shared/Modal/ModalInnerContainer'
import { ModalInput } from '@/shared/Modal/ModalInput'
import { SettingsInterface } from '@/shared/types'

import { PlaybackRateSlider } from './PlaybackRateSlider/PlaybackRateSlider'
import { VolumeSlider } from './VolumeSlider/VolumeSlider'

export const SettingsModal = ({
  toggle: toggleModal,
  motionKey,
}: {
  toggle: () => void
  motionKey: string
}) => {
  const { settings, updateSettings, SETTINGS_DEFAULTS } = useGlobalContext()
  const { addAlert } = useNotificationContext()

  const [state, setState] = useState<SettingsInterface>({
    ...SETTINGS_DEFAULTS,
  })

  useEffect(() => {
    if (settings) setState({ ...state, ...settings })
  }, [settings])

  const handleChangeNum = (event: ChangeEvent<HTMLInputElement>): void => {
    setState({ ...state, [event.target.id]: Number(event.target.value) })
  }

  const handleToggle = (settingsKey: string) => {
    console.log('toggle', settingsKey)
    setState({ ...state, [settingsKey]: !settings[settingsKey] })
  }

  const handleUpdate = (event: ChangeEvent<HTMLInputElement>): void => {
    event.preventDefault()

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
          <PlaybackRateSlider />
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
