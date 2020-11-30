/**
 * @path /src/components/shared/Text/Text.tsx
 *
 * @project videonote
 * @file Text.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 15th September 2020
 * @modified Monday, 30th November 2020 7:26:29 pm
 * @copyright © 2020 - 2020 MU
 */

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  className?: string
  props?: { [key: string]: any }
}

export const Heading = ({ className = '', ...props }: TextProps) => {
  return (
    <h1
      className={`${className} mt-0 mb-2 text-6xl font-normal leading-normal tracking-tight`}
      {...props}
    ></h1>
  )
}

export const SubHeading = ({ className = '', ...props }: TextProps) => {
  return (
    <h2
      className={`${className} mt-0 mb-2 text-2xl font-normal leading-normal tracking-tight`}
      {...props}
    ></h2>
  )
}

export const Text = ({ className = '', ...props }: TextProps) => {
  return (
    <p
      className={`${className} mt-0 mb-4 text-base leading-relaxed text-gray-800`}
      {...props}
    ></p>
  )
}
