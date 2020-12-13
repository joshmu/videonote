/**
 * @path /src/components/HelloPage/Overview/Overview.tsx
 *
 * @project videonote
 * @file Overview.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Friday, 11th December 2020
 * @modified Sunday, 13th December 2020 11:55:11 am
 * @copyright © 2020 - 2020 MU
 */

import Image from 'next/image'

import { Heading } from '@/shared/Text/Text'
import { Reveal } from '@/shared/ux/Reveal'

export const Overview = () => {
  // const imgSrc =
  //   'https://joshmu.s3-ap-southeast-2.amazonaws.com/videonote/vn-overview-hero.png'
  const imgSrc = '/images/vn-overview-hero.png'

  return (
    <div id='overview' className='container px-4 pt-24 mx-auto my-12'>
      <div className='flex flex-col items-center justify-center w-full md:flex-row'>
        <div className='relative w-full sm:w-3/4 md:flex-1'>
          {/* border */}
          <div className='absolute top-0 left-0 w-1 h-full rounded-full md:-left-4 bg-gradient-to-b from-themeAccent'></div>

          {/* text content */}
          <div className='ml-8 md:ml-4'>
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
                projects with a minimal design to keep you focused on what
                matters most!
              </p>
            </Reveal>
          </div>
        </div>

        {/* image */}
        <div className='relative w-full mx-auto mt-12 overflow-hidden rounded-lg shadow-xl md:ml-8 md:mt-0 md:w-2/3'>
          <Image src={imgSrc} width={2400} height={1431} layout='responsive' />
        </div>
      </div>
    </div>
  )
}
