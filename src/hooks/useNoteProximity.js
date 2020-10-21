import { useEffect, useState } from 'react'
const useNoteProximity = ({ todos, progress }) => {
  const [current, setCurrent] = useState(null)

  // detect closest todo to current play position
  useEffect(() => {
    // empty list
    if (todos.length === 0 && current !== null) setCurrent(null)

    // 1 todo
    if (todos.length === 1 && current === null) setCurrent(todos[0])

    // otherwise compare
    if (todos.length > 1) {
      const result = todos.reduce((closestTodo, nextTodo) => {
        const distA = Math.abs(closestTodo.time - progress.playedSeconds)
        const distB = Math.abs(nextTodo.time - progress.playedSeconds)
        return distA < distB ? closestTodo : nextTodo
      })

      setCurrent(result)
    }
  }, [progress.playedSeconds])

  const checkProximity = todo => current !== null && current.id === todo.id

  return { current, checkProximity }
}

export default useNoteProximity
