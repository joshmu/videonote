/**
 * @path /src/components/shared/ux/Parallax.tsx
 *
 * @project videonote
 * @file Parallax.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Thursday, 22nd October 2020
 * @modified Monday, 23rd November 2020 3:35:20 pm
 * @copyright © 2020 - 2020 MU
 */

import {
  motion,
  useSpring,
  useTransform,
  useViewportScroll,
} from 'framer-motion'
import { ReactNode, useLayoutEffect, useRef, useState } from 'react'

interface ParallaxProps {
  rate?: number
  className?: string
  children: ReactNode
  props?: { [key: string]: any }
}

export const Parallax = ({
  rate = 0,
  className = '',
  children,
  ...props
}: ParallaxProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollY } = useViewportScroll()
  const [offsetTop, setOffsetTop] = useState<number>(0)
  const [minHeight, setMinHeight] = useState<number | 'auto'>('auto')

  // randomize the rate if we do not specify (0.01-0.4)
  rate = rate === 0 ? rand(1, 40) / 100 : rate

  useLayoutEffect(() => {
    // useEffect(() => {
    if (!ref.current) return null
    const onResize = () => {
      // also add elem centre of screen by grabbing half screen height and elem height
      const halfWindowY =
        globalThis.window.innerHeight / 2 + ref.current.clientHeight / 2
      setOffsetTop(ref.current.offsetTop - halfWindowY)
      setMinHeight(
        calculateMinHeight(ref.current.offsetHeight - halfWindowY, rate)
      )
    }

    onResize()
    window.addEventListener('resize', onResize)

    return () => window.removeEventListener('resize', onResize)
  }, [ref])

  // todo: typescript spring config?
  const springConfig = {
    damping: 100,
    stiffness: 500,
    mass: rand(1, 3),
  }

  // transforming per px thats why we +1
  const y = useSpring(
    useTransform(scrollY, [offsetTop - 1, offsetTop + 1], [-rate, rate], {
      clamp: false,
    }),
    springConfig
  )

  return (
    <div
      ref={ref}
      style={{ minHeight, margin: 'auto', width: '100%' }}
      className={className}
    >
      <motion.div style={{ y }} {...props}>
        {children}
      </motion.div>
    </div>
  )
}

const calculateMinHeight = (height: number, range: number): number => {
  return height + height * range
}
const rand = (min: number = 0, max: number = 100): number => {
  return Math.floor(Math.random() * (+max - +min)) + +min
}
