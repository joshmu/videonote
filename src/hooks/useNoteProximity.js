import { useEffect, useState } from 'react'
const useNoteProximity = ({ todos, progress }) => {
  const [currentNote, setCurrentNote] = useState(null)

  // detect closest todo to current play position
  useEffect(() => {
    // empty list
    if (todos.length === 0 && currentNote !== null) setCurrentNote(null)

    // 1 todo
    if (todos.length === 1 && currentNote === null) setCurrentNote(todos[0])

    // otherwise compare
    if (todos.length > 1) {
      const result = todos.reduce((closestTodo, nextTodo) => {
        const distA = Math.abs(closestTodo.time - progress.playedSeconds)
        const distB = Math.abs(nextTodo.time - progress.playedSeconds)
        return distA < distB ? closestTodo : nextTodo
      })

      setCurrentNote(result)
    }
  }, [progress.playedSeconds])

  const checkProximity = todo =>
    currentNote !== null && currentNote.id === todo.id

  return { currentNote, checkProximity }
}

export default useNoteProximity
