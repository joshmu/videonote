import { AnimationControls, useAnimation } from 'framer-motion'
import { Ref, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'

export const useReveal = (): [Ref<HTMLDivElement>, AnimationControls] => {
  const controls = useAnimation()
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  useEffect(() => {
    if (inView) {
      controls.start('animate')
    }
  }, [controls, inView])

  return [ref, controls]
}
