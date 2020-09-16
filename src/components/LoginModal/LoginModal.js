export default function LoginModal() {
  return (
    <div className='w-full max-w-sm mx-auto overflow-hidden bg-white rounded-lg shadow-md'>
      <div className='px-6 py-4'>
        <h2 className='text-3xl font-bold text-center text-gray-700'>
          VideoNote
        </h2>

        <h3 className='mt-1 text-xl font-medium text-center text-gray-600'>
          Welcome Back
        </h3>

        <p className='mt-1 text-center text-gray-500'>
          Login or create account
        </p>

        <form>
          <div className='w-full mt-4'>
            <input
              className='block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none focus:shadow-outline'
              type='email'
              placeholder='Email Address'
              aria-label='Email Address'
            />
          </div>

          <div className='w-full mt-4'>
            <input
              className='block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none focus:shadow-outline'
              type='password'
              placeholder='Password'
              aria-label='Password'
            />
          </div>

          <div className='flex items-center justify-between mt-4'>
            <a href='#' className='text-sm text-gray-600 hover:text-gray-500'>
              Forget Password?
            </a>

            <button
              className='px-4 py-2 text-white bg-gray-700 rounded hover:bg-gray-600 focus:outline-none'
              type='button'
            >
              Login
            </button>
          </div>
        </form>
      </div>

      <div className='flex items-center justify-center py-4 text-center bg-gray-100'>
        <span className='text-sm text-gray-600'>Don't have an account? </span>

        <a
          href='#'
          className='mx-2 text-sm font-bold transition-colors duration-300 ease-in-out text-highlight-600 hover:text-highlight-500'
        >
          Register
        </a>
      </div>
    </div>
  )
}
