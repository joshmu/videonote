/**
 * @path /src/components/shared/LocalVideoForm/LocalVideoLoader.tsx
 *
 * @project videonote
 * @file LocalVideoLoader.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Thursday, 24th September 2020
 * @modified Sunday, 22nd November 2020 3:25:55 pm
 * @copyright © 2020 - 2020 MU
 */

import { ChangeEvent } from 'react'

export const LocalVideoLoader = ({
  handleVideoSrc,
}: {
  handleVideoSrc: (url: string) => void
}) => {
  const handleFileInput = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files[0]
    const url = URL.createObjectURL(file)
    handleVideoSrc(url)
  }

  return (
    <div className='mt-3'>
      <label htmlFor='videoFile'>
        <input
          className='hidden'
          id='videoFile'
          name='videoFile'
          type='file'
          onChange={handleFileInput}
        />
        <span className='px-4 py-2 text-sm transition-colors duration-200 ease-in-out border rounded-sm cursor-pointer text-themeText hover:border-transparent hover:text-themeBg hover:bg-themeAccent'>
          Use Local Video
        </span>
      </label>
    </div>
  )
}
