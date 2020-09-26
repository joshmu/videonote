import { useGlobalContext } from '../../context/globalContext'
import MotionFadeInOut from '../shared/MotionFadeInOut'

export default function SettingsModal({ toggle: toggleModal, CloseBtn }) {
  const { settings, updateSettings } = useGlobalContext()

  const handleChange = e => {
    if (e.target.id === 'offset')
      return updateSettings({ playOffset: Number(e.target.value) })
  }

  return (
    <MotionFadeInOut motionKey='settingsModal'>
      <div className='absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2'>
        <div className='relative max-w-4xl p-6 mx-auto border rounded-sm shadow-md border-themeText bg-themeBg'>
          <CloseBtn />

          <h2 className='text-lg font-semibold capitalize text-themeText'>
            Settings
          </h2>

          <form>
            <div className='grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2'>
              <div>
                <label className='text-themeText' htmlFor='offset'>
                  Playback Offset (Seconds)
                </label>
                <input
                  id='offset'
                  type='number'
                  className='block w-full px-4 py-2 mt-2 border rounded-sm text-themeText border-themeText bg-themeBg focus:border-gray-500 focus:outline-none focus:shadow-none'
                  value={settings.playOffset}
                  onChange={handleChange}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </MotionFadeInOut>
  )
}
