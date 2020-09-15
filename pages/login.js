import Link from 'next/link'
import Layout from '../src/components/Layout'
import ThemeToggle from '../src/components/ThemeToggle'

export default function Login() {
  return (
    <Layout>
    <ThemeToggle />
      <section className='absolute w-full h-full bg-themeBg'>
        <div className='container relative z-10 h-full px-4 mx-auto'>
          <div className='flex items-center content-center justify-center h-full'>
            <div className='w-full px-4 lg:w-4/12'>
              <div className='relative flex flex-col w-full min-w-0 mb-6 break-words border-0 rounded shadow-lg bg-highlight-100'>
                <div className='flex-auto px-4 py-10 pt-7 lg:px-10'>
                  <form>
                    <div className='relative w-full mb-3'>
                      <label
                        className='block mb-2 text-xs font-bold uppercase text-highlight-700'
                        htmlFor='grid-password'
                      >
                        Email
                      </label>
                      <input
                        type='email'
                        className='w-full px-3 py-3 text-sm bg-white rounded shadow text-highlight-700 placeholder-highlight-400 focus:outline-none focus:shadow-outline'
                        placeholder='Email'
                        style={{ transition: 'all .15s ease' }}
                      />
                    </div>

                    <div className='relative w-full mb-3'>
                      <label
                        className='block mb-2 text-xs font-bold uppercase text-highlight-700'
                        htmlFor='grid-password'
                      >
                        Password
                      </label>
                      <input
                        type='password'
                        className='w-full px-3 py-3 text-sm bg-white rounded shadow text-highlight-700 placeholder-highlight-400 focus:outline-none focus:shadow-outline'
                        placeholder='Password'
                        style={{ transition: 'all .15s ease' }}
                      />
                    </div>
                    <div>
                      <label className='inline-flex items-center cursor-pointer'>
                        <input
                          id='customCheckLogin'
                          type='checkbox'
                          className='w-5 h-5 ml-1 text-highlight-800 form-checkbox'
                          style={{ transition: 'all .15s ease' }}
                        />
                        <span className='ml-2 text-sm font-semibold text-highlight-700'>
                          Remember me
                        </span>
                      </label>
                    </div>

                    <div className='mt-6 text-center'>
                      <Link href='/vn'>
                        <button
                          className='w-full px-6 py-3 mb-1 mr-1 text-sm font-bold text-white uppercase transition-all duration-300 ease-in-out rounded shadow outline-none bg-highlight-900 active:bg-highlight-700 hover:shadow-lg focus:outline-none'
                          type='button'
                        >
                          Sign In
                        </button>
                      </Link>
                    </div>
                  </form>
                </div>
              </div>
              <div className='flex flex-wrap mt-6'>
                <div className='w-1/2'>
                  <a
                    href='#pablo'
                    onClick={e => e.preventDefault()}
                    className='text-highlight-600'
                  >
                    <small>Forgot password?</small>
                  </a>
                </div>
                <div className='w-1/2 text-right'>
                  <a
                    href='#pablo'
                    onClick={e => e.preventDefault()}
                    className='text-highlight-600'
                  >
                    <small>Create new account</small>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
