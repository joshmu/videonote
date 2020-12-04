import Link from 'next/link'

import { Heading2 } from '@/shared/Text/Text'

export const Header = () => {
  return (
    <header className='container w-full px-4 py-3 mx-auto'>
      <Link href='/hello'>
        <Heading2 className='cursor-pointer'>VideoNote</Heading2>
      </Link>
    </header>
  )
}
