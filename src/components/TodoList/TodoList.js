import { AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

import { useTodoContext } from '@/context/todoContext'
import { useVideoContext } from '@/context/videoContext'

import TodoItem from './TodoItem/TodoItem'

export default function TodoList() {
  const { todos, sort } = useTodoContext()
  const { progress } = useVideoContext()
  const [closest, setClosest] = useState(null)

  // detect closest todo to current play position
  useEffect(() => {
    // empty list
    if (todos.length === 0 && closest !== null) setClosest(null)

    // 1 todo
    if (todos.length === 1 && closest === null) setClosest(todos[0])

    // otherwise compare
    if (todos.length > 1) {
      const result = todos.reduce((closestTodo, nextTodo) => {
        const distA = Math.abs(closestTodo.time - progress.playedSeconds)
        const distB = Math.abs(nextTodo.time - progress.playedSeconds)
        return distA < distB ? closestTodo : nextTodo
      })

      setClosest(result)
    }
  }, [progress.playedSeconds])

  const checkClose = todo => closest !== null && closest.id === todo.id

  return (
    <div className='w-full bg-transparent'>
      <AnimatePresence>
        {sort(todos).map(todo => (
          <TodoItem todo={todo} key={todo.id} close={checkClose(todo)} />
        ))}
      </AnimatePresence>
    </div>
  )
}
