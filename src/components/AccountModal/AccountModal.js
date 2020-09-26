import MotionFadeInOut from '../shared/MotionFadeInOut'

export default function AccountModal({ toggle: toggleModal, CloseBtn }) {
  const handleUpdate = () => {
    console.log('updating account')
    toggleModal()
  }
  return (
    <MotionFadeInOut motionKey='accountModal'>
      <div className='absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2'>
        <div className='max-w-4xl p-6 mx-auto border shadow-md bg-themeBg rounded-sm-sm border-themeText'>
          <CloseBtn />

          <h2 className='text-lg font-semibold capitalize text-themeText'>
            Account settings
          </h2>

          <form>
            <div className='grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2'>
              <div>
                <label className='text-themeText' htmlFor='username'>
                  Username
                </label>
                <input
                  id='username'
                  type='text'
                  className='block w-full px-4 py-2 mt-2 border border-gray-300 rounded-sm text-themeText bg-themeBg focus:border-blue-500 focus:outline-none focus:shadow-outline'
                />
              </div>

              <div>
                <label className='text-themeText' htmlFor='emailAddress'>
                  Email Address
                </label>
                <input
                  id='emailAddress'
                  type='email'
                  className='block w-full px-4 py-2 mt-2 border border-gray-300 rounded-sm text-themeText bg-themeBg focus:border-blue-500 focus:outline-none focus:shadow-outline'
                />
              </div>

              <div>
                <label className='text-themeText' htmlFor='password'>
                  Password
                </label>
                <input
                  id='password'
                  type='password'
                  className='block w-full px-4 py-2 mt-2 border border-gray-300 rounded-sm text-themeText bg-themeBg focus:border-blue-500 focus:outline-none focus:shadow-outline'
                />
              </div>

              <div>
                <label
                  className='text-themeText'
                  htmlFor='passwordConfirmation'
                >
                  Password Confirmation
                </label>
                <input
                  id='passwordConfirmation'
                  type='password'
                  className='block w-full px-4 py-2 mt-2 border border-gray-300 rounded-sm text-themeText bg-themeBg focus:border-blue-500 focus:outline-none focus:shadow-outline'
                />
              </div>
            </div>

            <div className='flex justify-end mt-4'>
              <button
                onClick={handleUpdate}
                className='px-4 py-2 text-gray-200 bg-gray-800 rounded-sm hover:bg-gray-700 focus:outline-none focus:bg-gray-700'
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </MotionFadeInOut>
  )
}
