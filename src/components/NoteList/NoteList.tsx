/**
 * @path /src/components/NoteList/NoteList.tsx
 *
 * @project videonote
 * @file NoteList.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 14th September 2020
 * @modified Sunday, 4th June 2023 1:15:44 pm
 * @copyright © 2020 - 2020 MU
 */

import { AnimatePresence, Variants, motion } from 'framer-motion'

import { useNoteContext } from '@/context/noteContext'

import { NoteItem } from './NoteItem/NoteItem'

const parentVariants: Variants = {
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

const childVariants: Variants = {
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

export const NoteList = () => {
  const { notes, sort, checkProximity } = useNoteContext()

  return (
    <div className='w-full pb-8 bg-transparent'>
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
