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
        @ VideoNote™
      </p>
      <p className='mt-2 text-sm opacity-75 text-themeText'>
        {new Date().getFullYear()}
      </p>
      <p className='mt-4 space-x-4 text-themeText2'>
        <Link href='/privacy' className='underline'>
          Privacy Policy
        </Link>{' '}
        <Link href='/terms' className='underline'>
          Terms
        </Link>
      </p>
    </footer>
  );
}
