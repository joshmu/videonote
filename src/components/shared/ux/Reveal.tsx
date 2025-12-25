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

import { ReactNode, useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'

interface RevealProps {
  children: ReactNode
  delay?: number
  duration?: number
  [key: string]: any
}

export const Reveal = ({
  children,
  delay = 0,
  duration = 600,
  ...props
}: RevealProps) => {
  const [isRevealed, setIsRevealed] = useState(false)
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '50px 0px',
  })

  useEffect(() => {
    if (inView) {
      if (delay > 0) {
        const timer = setTimeout(() => setIsRevealed(true), delay)
        return () => clearTimeout(timer)
      }
      setIsRevealed(true)
    }
  }, [inView, delay])

  // Fallback: ensure content is revealed after a maximum wait time
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setIsRevealed(true)
    }, 2000 + delay)
    return () => clearTimeout(fallbackTimer)
  }, [delay])

  return (
    <div
      ref={ref}
      style={{
        opacity: isRevealed ? 1 : 0,
        transform: isRevealed ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
        transitionDelay: `${delay}ms`,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
