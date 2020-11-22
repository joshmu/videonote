/**
 * @path /src/components/Modals/SettingsModal/PlaybackRateSlider/PlaybackRateSlider.tsx
 *
 * @project videonote
 * @file PlaybackRateSlider.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 19th October 2020
 * @modified Sunday, 22nd November 2020 5:38:29 pm
 * @copyright © 2020 - 2020 MU
 */

import { ChangeEvent } from 'react'

import { useVideoContext } from '@/context/videoContext'
import { ModalInput } from '@/shared/Modal/ModalInput'

export const PlaybackRateSlider = () => {
  const { playbackRate, setPlaybackRate } = useVideoContext()

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void =>
    setPlaybackRate(+event.target.value)

  return (
    <div>
      <ModalInput
        title={`Playback Rate (${playbackRate}x)`}
        id='playbackRate'
        value={playbackRate}
        onChange={handleChange}
        type='range'
        min='0.5'
        max='4'
        step='0.01'
      />
    </div>
  )
}
