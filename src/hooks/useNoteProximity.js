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
      const result = notes.reduce((closestNote, nextNote) => {
        const distA = Math.abs(closestNote.time - progress.playedSeconds)
        const distB = Math.abs(nextNote.time - progress.playedSeconds)
        return distA < distB ? closestNote : nextNote
      })

      setCurrentNote(result)
    }
  }, [progress.playedSeconds])

  const checkProximity = note =>
    currentNote !== null && currentNote._id === note._id

  return { currentNote, checkProximity }
}

export default useNoteProximity
