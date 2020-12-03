/**
 * @path /src/components/shared/Text/Text.tsx
 *
 * @project videonote
 * @file Text.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 15th September 2020
 * @modified Thursday, 3rd December 2020 4:33:08 pm
 * @copyright © 2020 - 2020 MU
 */

import { ReactNode } from 'react'

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  className?: string
  children: ReactNode
  props?: { [key: string]: any }
}

export const Heading = ({ className = '', children, ...props }: TextProps) => {
  return (
    <h1
      className={`${className} mt-0 mb-2 text-6xl font-normal leading-normal tracking-tight font-serif`}
      {...props}
    >
      {children}
    </h1>
  )
}

export const Heading2 = ({ className = '', children, ...props }: TextProps) => {
  return (
    <h2
      className={`text-3xl font-bold text-themeAccent mt-0 mb-2 font-serif tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h2>
  )
}

export const SubHeading = ({
  className = '',
  children,
  ...props
}: TextProps) => {
  return (
    <h3
      className={`${className} mt-1 text-xl font-normal text-center text-themeText font-sans`}
      {...props}
    >
      {children}
    </h3>
  )
}

export const Text = ({ className = '', children, ...props }: TextProps) => {
  return (
    <p
      className={`${className} mt-0 mb-4 text-base leading-relaxed text-gray-800`}
      {...props}
    >
      {children}
    </p>
  )
}

// highlight/accent text
export const Hl = ({ className = '', children, ...props }: TextProps) => (
  <span className={`text-themeAccent ${className}`} {...props}>
    {children}
  </span>
)
