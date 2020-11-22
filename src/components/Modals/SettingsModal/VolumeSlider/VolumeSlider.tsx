/**
 * @path /src/components/Modals/SettingsModal/VolumeSlider/VolumeSlider.tsx
 *
 * @project videonote
 * @file VolumeSlider.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 19th October 2020
 * @modified Sunday, 22nd November 2020 5:39:53 pm
 * @copyright © 2020 - 2020 MU
 */

import { ChangeEvent } from 'react'

import { useVideoContext } from '@/context/videoContext'
import { ModalInput } from '@/shared/Modal/ModalInput'

export const VolumeSlider = () => {
  const { volume, setVolume } = useVideoContext()

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void =>
    setVolume(+event.target.value)

  return (
    <ModalInput
      title={`Volume (${Math.floor(volume * 100)}%)`}
      id='volume'
      value={volume}
      onChange={handleChange}
      type='range'
      min='0'
      max='1'
      step='0.01'
    />
  )
}
