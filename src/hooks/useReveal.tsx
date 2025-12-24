import { Ref } from 'react'
import { useInView } from 'react-intersection-observer'

export const useReveal = (): [Ref<HTMLDivElement>, boolean] => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0,
    rootMargin: '100px 0px',
  })

  return [ref, inView]
}
