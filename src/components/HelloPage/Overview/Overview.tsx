/**
 * @path /src/components/HelloPage/Overview/Overview.tsx
 *
 * @project videonote
 * @file Overview.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Friday, 11th December 2020
 * @modified Friday, 11th December 2020 1:05:03 pm
 * @copyright © 2020 - 2020 MU
 */

// import Image from 'next/image'

import { Heading } from '@/shared/Text/Text'
import { Reveal } from '@/shared/ux/Reveal'

export const Overview = () => {
  const imgSrc =
    'https://joshmu.s3-ap-southeast-2.amazonaws.com/videonote/vn-overview-hero.png'

  return (
    <div id='overview' className='container px-4 mx-auto mb-12 mt-36'>
      <div className='flex items-center justify-center w-full gap-8'>
        <div className='relative flex-1 ml-8'>
          {/* border */}
          <div className='absolute top-0 w-1 h-full rounded-full -left-8 bg-gradient-to-b from-themeAccent'></div>

          {/* text content */}
          <Reveal>
            <Heading>VideoNote</Heading>
          </Reveal>
          <Reveal>
            <h2 className='mb-8 text-xl italic opacity-50 text-themeText'>
              ...efficiency at it's core.
            </h2>
          </Reveal>
          <Reveal>
            <p className='tracking-wide'>
              A fast and easy workflow to review video content. Utilising a
              variety of intuitive keyboard shortcuts, seamless sharing of
              projects with a minimal design to keep you focused on what matters
              most!
            </p>
          </Reveal>
        </div>

        {/* image */}
        <div className='relative w-2/3 overflow-hidden rounded-lg shadow-xl'>
          {/* <Image src={imgSrc} width={2400} height={1431} layout='responsive' /> */}
        </div>
      </div>
    </div>
  )
}
