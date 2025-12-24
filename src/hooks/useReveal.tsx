import { AnimationControls, useAnimation } from 'framer-motion'
import { Ref, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'

export const useReveal = (): [Ref<HTMLDivElement>, AnimationControls] => {
  const controls = useAnimation()
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0,
    rootMargin: '50px 0px',
  })

  useEffect(() => {
    if (inView) {
      controls.start('animate')
    }
  }, [controls, inView])

  // Fallback: if not animated after 2 seconds, show content anyway
  useEffect(() => {
    const timer = setTimeout(() => {
      controls.start('animate')
    }, 2000)
    return () => clearTimeout(timer)
  }, [controls])

  return [ref, controls]
}
