import { useState } from 'react'
import MotionFadeInOut from '../shared/MotionFadeInOut'

export default function Contact(props) {
  const [state, setState] = useState({
    name: '',
    email: '',
    message: '',
    sent: false,
    error: null,
  })

  const handleChange = e => {
    // match the state props with the placeholder names
    const id = e.target.placeholder.toLowerCase()
    setState({ ...state, [id]: e.target.value })
  }

  const handleSubmit = async () => {
    if (state.sent || state.email.length === 0 || state.message.length === 0)
      return

    const url = '/api/email'

    const settings = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...state }),
    }

    try {
      const fetchResponse = await fetch(url, settings)
      const data = await fetchResponse.json()
      console.log('response', data) // parses JSON response into native JavaScript objects
      setState({ ...state, sent: true })
    } catch (err) {
      console.error(err.message)
      setState({ ...state, error: err.message })
    }
  }

  return (
    <section id='contact' className='relative text-themeText' {...props}>
      <div className='container px-5 py-24 mx-auto'>
        <div className='flex flex-col w-full mb-12 text-center'>
          <h2 className='mb-2 text-2xl font-light text-themeText sm:text-3xl'>
            FEEL FREE TO <span className='font-semibold'>CONTACT</span>
          </h2>
          <p className='mx-auto mt-4 text-sm italic leading-relaxed lg:w-2/3 text-themeTextSecondary'>
            Let's talk!
          </p>
        </div>
        <div className='mx-auto lg:w-1/2 md:w-2/3'>
          <div className='flex flex-wrap -m-2 text-gray-900'>
            <div className='w-1/2 p-2'>
              <input
                value={state.name}
                onChange={handleChange}
                className='w-full px-4 py-2 text-base bg-gray-100 border border-gray-400 rounded-sm focus:outline-none focus:border-themeAccent'
                placeholder='Name'
                type='text'
              />
            </div>
            <div className='w-1/2 p-2'>
              <input
                value={state.email}
                onChange={handleChange}
                className='w-full px-4 py-2 text-base bg-gray-100 border border-gray-400 rounded-sm focus:outline-none focus:border-themeAccent'
                placeholder='Email'
                type='email'
              />
            </div>
            <div className='w-full p-2'>
              <textarea
                onChange={handleChange}
                className='block w-full h-48 px-4 py-2 text-base bg-gray-100 border border-gray-400 rounded-sm resize-none focus:outline-none focus:border-themeAccent'
                placeholder='Message'
              ></textarea>
            </div>
            <div className='w-full p-2'>
              <button
                onClick={handleSubmit}
                disabled={state.sent}
                className={`${
                  state.sent && 'opacity-50'
                } flex px-8 py-2 mx-auto text-lg text-white uppercase transition-all duration-300 ease-in-out border-0 rounded-sm bg-themeAccent focus:outline-none hover:bg-orange-500`}
              >
                {state.sent ? '️✓' : 'send'}
              </button>
            </div>
            <div className='w-full p-2 pt-8 mt-8 text-center border-t border-gray-200'>
              {state.error && (
                <MotionFadeInOut motionKey='mail-error'>
                  <p className='text-xl italic text-red-500 animate-bounce'>
                    A server error has occurred, please use my email instead.
                  </p>
                </MotionFadeInOut>
              )}
              {state.sent ? (
                <MotionFadeInOut motionKey='mail-sent'>
                  <p className='text-xl italic text-green-500 animate-bounce'>
                    Message sent!
                  </p>
                </MotionFadeInOut>
              ) : (
                <MotionFadeInOut motionKey='mail-info'>
                  <a
                    href='&#109;&#097;&#105;&#108;&#116;&#111;:&#104;&#101;&#108;&#108;&#111;&#064;&#106;&#111;&#115;&#104;&#109;&#117;&#046;&#099;&#111;&#109;'
                    className='transition-colors duration-300 ease-in-out text-themeAccent hover:text-orange-500'
                  >
                    👋
                    &#104;&#101;&#108;&#108;&#111;&#064;&#106;&#111;&#115;&#104;&#109;&#117;&#046;&#099;&#111;&#109;
                  </a>
                </MotionFadeInOut>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
