import TodoItem from './TodoItem'
import { useTodoContext } from '../../context/todoContext'
import { AnimatePresence } from 'framer-motion'

export default function TodoList() {
  const { todos, sort } = useTodoContext()

  return (
    <div className='w-full bg-transparent'>
      <AnimatePresence>
        {sort(todos).map(todo => (
          <TodoItem todo={todo} key={todo.id} />
        ))}
      </AnimatePresence>
    </div>
  )
}
