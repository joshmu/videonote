import { debounce } from 'lodash'
import { useEffect } from 'react'

export const useSetVh = (): void => {
  useEffect(() => {
    const onResize = () => {
      // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
      let vh: number = window.innerHeight * 0.01
      console.log(`setting vh to ${vh}px`)
      // Then we set the value in the --vh custom property to the root of the document
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }
    const debounceOnResize = debounce(onResize, 200)

    onResize()
    window.addEventListener('resize', debounceOnResize)

    return () => window.removeEventListener('resize', onResize)
  }, [])
}
