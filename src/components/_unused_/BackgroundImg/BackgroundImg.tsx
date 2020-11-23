/**
 * @path /src/components/_unused_/BackgroundImg/BackgroundImg.tsx
 *
 * @project videonote
 * @file BackgroundImg.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 15th September 2020
 * @modified Monday, 23rd November 2020 2:59:49 pm
 * @copyright © 2020 - 2020 MU
 */

interface BackgroundImgProps {
  src?: string | null
  style?: object
  className?: object
  props?: { [key: string]: any }
}

export const BackgroundImg = ({
  src = null,
  style = {},
  className = {},
  ...props
}: BackgroundImgProps) => {
  const bgImageSrc: { backgroundImage?: string } = src
    ? { backgroundImage: `url(${src})` }
    : {}

  return (
    <div
      className={`${className} absolute top-0 bottom-0 left-0 right-0 w-full h-full z-0 pointer-events-none`}
      style={{
        ...bgImageSrc,
        ...style,
        backgroundSize: '100%',
        backgroundRepeat: 'no-repeat',
      }}
      {...props}
    ></div>
  )
}
