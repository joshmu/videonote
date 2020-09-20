import { useGlobalContext } from '../../context/globalContext'
import Animate from '../shared/Animate'

export default function ProjectModal() {
  const { modalOpen } = useGlobalContext()
  return (
    <>
      {modalOpen === 'account' && (
        <Animate motionKey='accountModal'>
          <div className='absolute top-0 bottom-0 left-0 right-0 bg-black bg-opacity-50'></div>
          <div className='absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2'>
            <div className='max-w-4xl p-6 mx-auto bg-white rounded-sm shadow-md'>
              <h2 className='text-lg font-semibold text-gray-700 capitalize'>
                Account settings
              </h2>

              <form>
                <div className='grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2'>
                  <div>
                    <label className='text-gray-700' htmlFor='username'>
                      Username
                    </label>
                    <input
                      id='username'
                      type='text'
                      className='block w-full px-4 py-2 mt-2 text-gray-800 bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none focus:shadow-outline'
                    />
                  </div>

                  <div>
                    <label className='text-gray-700' htmlFor='emailAddress'>
                      Email Address
                    </label>
                    <input
                      id='emailAddress'
                      type='email'
                      className='block w-full px-4 py-2 mt-2 text-gray-800 bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none focus:shadow-outline'
                    />
                  </div>

                  <div>
                    <label className='text-gray-700' htmlFor='password'>
                      Password
                    </label>
                    <input
                      id='password'
                      type='password'
                      className='block w-full px-4 py-2 mt-2 text-gray-800 bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none focus:shadow-outline'
                    />
                  </div>

                  <div>
                    <label
                      className='text-gray-700'
                      htmlFor='passwordConfirmation'
                    >
                      Password Confirmation
                    </label>
                    <input
                      id='passwordConfirmation'
                      type='password'
                      className='block w-full px-4 py-2 mt-2 text-gray-800 bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none focus:shadow-outline'
                    />
                  </div>
                </div>

                <div className='flex justify-end mt-4'>
                  <button className='px-4 py-2 text-gray-200 bg-gray-800 rounded hover:bg-gray-700 focus:outline-none focus:bg-gray-700'>
                    Save
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
