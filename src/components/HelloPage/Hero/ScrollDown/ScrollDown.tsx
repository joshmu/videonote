import { motion } from 'framer-motion'
import { AiOutlineArrowDown as ArrowDownIcon } from 'react-icons/ai'
import { scroller } from 'react-scroll'

export const ScrollDown = ({ to }: { to: string }) => {
  const handleDown = (): void => {
    scrollTo(to)
  }

  return (
    <div className='absolute bottom-0 flex items-center justify-center w-full h-16'>
      <motion.button
        whileHover={{ scale: 1.1 }}
        onClick={handleDown}
        className='text-2xl cursor-pointer animate-pulse text-themeAccent focus:outline-none'
      >
        <ArrowDownIcon />
      </motion.button>
    </div>
  )
}

const scrollTo = (elemId: string): void => {
  scroller.scrollTo(elemId, {
    duration: 800,
    delay: 0,
    smooth: 'easeInOutQuint',
  })
}
