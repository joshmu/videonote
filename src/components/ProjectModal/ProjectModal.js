import { useGlobalContext } from '../../context/globalContext'
import Animate from '../shared/Animate'

// todo: project title => id
// todo: lock project title ? or use hidden random id?
// todo: video src
// todo: update
// todo: onChange handle all inputs

export default function ProjectModal() {
  const { modalOpen, toggleModalOpen, settings } = useGlobalContext()

  const handleUpdate = () => {
    window.alert('update project')
    toggleModalOpen('project')
  }

  return (
    <>
      {modalOpen === 'project' && (
        <Animate motionKey='projectModal'>
          <div className='absolute top-0 bottom-0 left-0 right-0 bg-black bg-opacity-50'></div>
          <div className='absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2'>
            <div className='max-w-4xl p-6 mx-auto bg-white rounded-sm shadow-md'>
              <h2 className='text-lg font-semibold text-gray-700 capitalize'>
                Project settings
              </h2>

              <form>
                <div className='grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2'>
                  <div>
                    <label className='text-gray-700' htmlFor='projectTitle'>
                      Project Title
                    </label>
                    <input
                      id='projectTitle'
                      type='text'
                      className='block w-full px-4 py-2 mt-2 text-gray-800 bg-white border border-gray-300 rounded-sm focus:border-gray-500 focus:outline-none focus:shadow-none'
                    />
                  </div>

                  <div>
                    <label className='text-gray-700' htmlFor='video'>
                      Video Source
                    </label>
                    <input
                      id='video'
                      type='text'
                      className='block w-full px-4 py-2 mt-2 text-gray-800 bg-white border border-gray-300 rounded-sm focus:border-gray-500 focus:outline-none focus:shadow-none'
                    />
                  </div>

                  <div>
                    <label className='text-gray-700' htmlFor='offset'>
                      Playback Offset (Secs)
                    </label>
                    <input
                      id='offset'
                      type='number'
                      value={settings.playOffset}
                      className='block w-full px-4 py-2 mt-2 text-gray-800 bg-white border border-gray-300 rounded-sm focus:border-gray-500 focus:outline-none focus:shadow-none'
                    />
                  </div>
                </div>

                <div className='flex justify-end mt-4'>
                  <button
                    onClick={handleUpdate}
                    className='px-4 py-2 text-gray-200 bg-gray-800 rounded hover:bg-gray-700 focus:outline-none focus:bg-gray-700'
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Animate>
      )}
    </>
  )
}
