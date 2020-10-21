import { AnimatePresence, motion } from 'framer-motion'

import { useTodoContext } from '@/context/todoContext'
import { useVideoContext } from '@/context/videoContext'

import TodoItem from './TodoItem/TodoItem'
import useNoteProximity from '@/hooks/useNoteProximity'

export default function TodoList() {
  const { todos, sort } = useTodoContext()
  const { progress } = useVideoContext()

  const { checkProximity } = useNoteProximity({ todos, progress })

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
          key='todoList'
          initial='initial'
          animate='animate'
          exit='exit'
          variants={parentVariants}
        >
          {sort(todos).map(todo => (
            <TodoItem
              todo={todo}
              key={todo.id}
              closestProximity={checkProximity(todo)}
              childVariants={childVariants}
            />
          ))}
        </motion.ul>
      </AnimatePresence>
    </div>
  )
}
