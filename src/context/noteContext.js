import { createContext, useContext, useEffect, useState } from 'react'

import useNoteProximity from '@/hooks/useNoteProximity'

import { useGlobalContext } from './globalContext'
import { useVideoContext } from './videoContext'

const noteContext = createContext({
  notes: [],
  addNote: a => {},
  updateNote: a => {},
  removeNote: a => {},
  updateSearch: a => {},
  sort: a => [],
  search: '',
  removeCompleted: () => {},
})

export function NoteProvider(props) {
  const { project, projects, updateProject, createNoteApi } = useGlobalContext()
  const { progress } = useVideoContext()
  const [notes, setNotes] = useState([])
  const [search, setSearch] = useState('')

  const { currentNote, checkProximity } = useNoteProximity({ notes, progress })

  // when a project is selected pre-fill the notes
  useEffect(() => {
    if (project !== null) setNotes(project.notes)
  }, [project])

  // when there are no projects present make sure state is reset
  useEffect(() => {
    if (projects.length > 0) return
    setNotes([])
    setSearch('')
  }, [projects])

  // when notes change, update project
  // useEffect(() => {
  //   // we shouldn't need to update notes if there are none.  even remove notes should still be present
  //   if (notes.length === 0) return
  //   // if the project.notes matches state notes then this is our initial load from server so don't update
  //   if (JSON.stringify(project.notes) === JSON.stringify(notes)) return

  //   const updatedProject = project
  //   updatedproject.notes = notes
  //   updateProject(updatedProject)
  // }, [notes])

  const addNote = note => {
    const newNote = {
      id: Date.now(),
      content: note.content,
      time: note.time,
      done: false,
      project: project._id,
    }
    setNotes([...notes, newNote])
    createNoteApi(newNote).then(res => {
      if (res === 'error') {
        // remove newly added note
        setNotes(current => {
          return current.filter(note => note.id !== newNote.id)
        })
      }
    })
  }

  const updateNote = note => {
    const updatedNotes = notes.map(t => (t.id === note.id ? note : t))
    setNotes(updatedNotes)
  }

  const removeNote = id => {
    const updatedNotes = notes.filter(note => note.id !== id)
    setNotes(updatedNotes)
  }

  const updateSearch = txt => {
    setSearch(txt)
  }

  const sort = notes => {
    // default is to sort chronologically
    let sorted = notes.sort((p, c) => p.time - c.time)

    // search
    if (search !== '') {
      sorted = sorted.filter(note => note.content.includes(search))
    }

    return sorted
  }

  const removeCompleted = () => {
    setNotes(currentNotes => {
      const updatedNotes = currentNotes.filter(note => !note.done)
      return updatedNotes
    })
  }

  const value = {
    notes,
    addNote,
    updateNote,
    removeNote,
    search,
    updateSearch,
    sort,
    removeCompleted,
    checkProximity,
    currentNote,
  }

  return <noteContext.Provider value={value} {...props} />
}

export function useNoteContext() {
  return useContext(noteContext)
}
