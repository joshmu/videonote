import { motion } from 'framer-motion'
import { StyleHTMLAttributes } from 'react'
import { AiOutlineArrowDown as ArrowDownIcon } from 'react-icons/ai'
import { scroller } from 'react-scroll'

export const ScrollDown = ({
  to,
  style = {},
}: {
  to: string
  style?: { [key: string]: React.CSSProperties }
}) => {
  const handleDown = (): void => {
    scrollTo(to)
  }

  return (
    <div
      className='absolute bottom-0 flex items-center justify-center w-full h-16'
      style={style}
    >
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
