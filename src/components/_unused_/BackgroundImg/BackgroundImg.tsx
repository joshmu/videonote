/**
 * @path /src/components/_unused_/BackgroundImg/BackgroundImg.tsx
 *
 * @project videonote
 * @file BackgroundImg.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 15th September 2020
 * @modified Wednesday, 2nd December 2020 3:01:58 pm
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
      className={`${className} absolute inset-0 w-full h-full z-0 pointer-events-none`}
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
