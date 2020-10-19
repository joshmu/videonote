import ModalInput from '@/components/shared/Modal/ModalInput'
import { useVideoContext } from '@/context/videoContext'

const PlaybackRateSlider = () => {
  const { playbackRate, setPlaybackRate } = useVideoContext()
  return (
    <div>
      <ModalInput
        title={`Playback Rate (${playbackRate}x)`}
        id='playbackRate'
        value={playbackRate}
        onChange={e => setPlaybackRate(+e.target.value)}
        type='range'
        min='0.5'
        max='4'
        step='0.01'
      />
    </div>
  )
}

export default PlaybackRateSlider
