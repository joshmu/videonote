import {
  motion,
  useSpring,
  useTransform,
  useViewportScroll,
} from 'framer-motion'
import { useLayoutEffect, useRef, useState } from 'react'

const calculateMinHeight = (height, range) => {
  return height + height * range
}
const rand = (min = 0, max = 100) => {
  return Math.floor(Math.random() * (+max - +min)) + +min
}

const Parallax = ({ rate = 0, className = '', children, ...props }) => {
  const ref = useRef(null)
  const { scrollY } = useViewportScroll()
  const [offsetTop, setOffsetTop] = useState(0)
  const [minHeight, setMinHeight] = useState('auto')

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

export default Parallax
