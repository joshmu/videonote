/**
 * @path /src/components/shared/Text/Text.tsx
 *
 * @project videonote
 * @file Text.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 15th September 2020
 * @modified Sunday, 22nd November 2020 3:31:10 pm
 * @copyright © 2020 - 2020 MU
 */

type TextProps = {
  className?: string
  props: {}
}

export const Heading = ({ className = '', ...props }): TextProps => {
  return (
    <h1
      className={`${className} mt-0 mb-2 text-6xl font-normal leading-normal tracking-tight`}
      {...props}
    ></h1>
  )
}

export const SubHeading = ({ className = '', ...props }): TextProps => {
  return (
    <h2
      className={`${className} mt-0 mb-2 text-2xl font-normal leading-normal tracking-tight`}
      {...props}
    ></h2>
  )
}

export const Text = ({ className = '', ...props }): TextProps => {
  return (
    <p
      className={`${className} mt-0 mb-4 text-base leading-relaxed text-gray-800`}
      {...props}
    ></p>
  )
}
