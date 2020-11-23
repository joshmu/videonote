/**
 * @path /src/components/shared/ux/Compressor.tsx
 *
 * @project videonote
 * @file Compressor.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 15th September 2020
 * @modified Monday, 23rd November 2020 3:20:14 pm
 * @copyright © 2020 - 2020 MU
 */

import { Variants, motion, useAnimation } from 'framer-motion'
import { useViewportScroll } from 'framer-motion'
import React, { useEffect, useState } from 'react'

const animationVariants: Variants = {
  hide: {
    width: 0,
    opacity: 0,
  },
  show: {
    width: 'auto',
    opacity: 1,
    transition: {
      duration: 1,
      ease: [0.6, 0.05, -0.01, 0.9],
    },
  },
}

export const Compressor = ({
  text,
  hide,
  ...props
}: {
  text: string
  hide: string
  props: { [key: string]: any }
}) => {
  const [output, setOutput] = useState<[string, string, string]>(['', '', ''])
  const [toggle, setToggle] = useState<boolean>(false)

  const { scrollYProgress } = useViewportScroll()
  const controls = useAnimation()

  useEffect(() => {
    // split text in to 3 parts
    const textArray: [string, string, string] = Array(3) as [
      string,
      string,
      string
    ]
    textArray[0] = text.slice(0, text.indexOf(hide))
    textArray[1] = hide
    textArray[2] = text.slice(text.indexOf(hide) + hide.length)
    setOutput(textArray)
  }, [])

  useEffect(() => {
    controls.start(toggle ? 'hide' : 'show')
  }, [toggle])

  useEffect(() => {
    if (scrollYProgress.get() > 0) {
      setToggle(true)
    } else if (toggle && scrollYProgress.get() === 0) {
      setToggle(false)
    }
  }, [scrollYProgress])

  return (
    <p className='flex items-center justify-center whitespace-pre' {...props}>
      <span>{output[0]}</span>
      <motion.span
        variants={animationVariants}
        animate={controls}
        className='overflow-hidden'
      >
        <span>{output[1]}</span>
      </motion.span>
      <span>{output[2]}</span>
    </p>
  )
}
