import { AnimatePresence, motion } from 'framer-motion'

import { useNoteContext } from '@/context/noteContext'

import NoteItem from './NoteItem/NoteItem'

const NoteList = () => {
  const { notes, sort, checkProximity } = useNoteContext()

  const parentVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        delayChildren: 0,
        staggerChildren: 0.2,
      },
    },
    exit: { opacity: 0 },
  }

  const childVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.6, 0.05, -0.01, 0.9],
      },
    },
    exit: { opacity: 0 },
  }

  return (
    <div className='w-full bg-transparent'>
      <AnimatePresence exitBeforeEnter>
        <motion.ul
          key='noteList'
          initial='initial'
          animate='animate'
          exit='exit'
          variants={parentVariants}
        >
          {sort(notes).map(note => (
            <NoteItem
              note={note}
              key={note._id}
              closestProximity={checkProximity(note)}
              childVariants={childVariants}
            />
          ))}
        </motion.ul>
      </AnimatePresence>
    </div>
  )
}

export default NoteList
