/**
 * @path /src/components/shared/ux/Reveal.tsx
 *
 * @project videonote
 * @file Reveal.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 14th September 2020
 * @modified Monday, 23rd November 2020 3:36:56 pm
 * @copyright © 2020 - 2020 MU
 */

import { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  variants?: object
  transition?: object
  [key: string]: any
}

export const Reveal = ({
  children,
  variants,
  transition,
  ...props
}: RevealProps) => {
  // Temporarily disabled animation - just render children
  return <div {...props}>{children}</div>
}
