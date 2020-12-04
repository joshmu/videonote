import Link from 'next/link'

export const Footer = () => {
  return (
    <footer className='container py-20 mx-auto text-center'>
      <p>
        Made with <span>♡</span> by{' '}
        <a
          className='font-bold underline text-themeAccent'
          href='https://joshmu.dev'
        >
          MU
        </a>{' '}
        and other team members @ VideoNote™
      </p>
      <p className='mt-2 text-sm opacity-75 text-themeText'>
        2020 - {new Date().getFullYear()}
      </p>
      <p className='mt-4 space-x-4 text-themeText2'>
        <Link href='/privacy' passHref>
          <a className='underline'>Privacy Policy</a>
        </Link>{' '}
        <a className='underline' href='/terms'>
          Terms
        </a>
      </p>
    </footer>
  )
}
