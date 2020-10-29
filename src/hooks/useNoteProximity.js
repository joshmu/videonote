import { useEffect, useState } from 'react'
const useNoteProximity = ({ notes, progress }) => {
  const [currentNote, setCurrentNote] = useState(null)

  // detect closest todo to current play position
  useEffect(() => {
    // empty list
    if (notes.length === 0 && currentNote !== null) setCurrentNote(null)

    // 1 todo
    if (notes.length === 1 && currentNote === null) setCurrentNote(notes[0])

    // otherwise compare
    if (notes.length > 1) {
      const result = notes.reduce((closestTodo, nextTodo) => {
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
