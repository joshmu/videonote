import ModalInput from '@/components/shared/Modal/ModalInput'
import { useVideoContext } from '@/context/videoContext'

const VolumeSlider = () => {
  const { volume, setVolume } = useVideoContext()

  return (
    <ModalInput
      title={`Volume (${Math.floor(volume * 100)}%)`}
      id='volume'
      value={volume}
      onChange={e => setVolume(+e.target.value)}
      type='range'
      min='0'
      max='1'
      step='0.01'
    />
  )
}

export default VolumeSlider
