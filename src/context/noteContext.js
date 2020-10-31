import mongoose from 'mongoose'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

import { useIsMount } from '@/hooks/useIsMount'
import useNoteProximity from '@/hooks/useNoteProximity'

import { useGlobalContext } from './globalContext'
import { useVideoContext } from './videoContext'

const createMongooseId = () => new mongoose.Types.ObjectId().toString()

const noteContext = createContext({
  notes: [],
  addNote: a => {},
  removeNote: a => {},
  updateSearch: a => {},
  sort: a => [],
  search: '',
  removeCompleted: () => {},
})

export function NoteProvider(props) {
  const {
    project,
    projects,
    updateProject,
    noteApi,
    noteApiRemoveDoneNotes,
    updateProjectsStateWithUpdatedNotes,
  } = useGlobalContext()
  const { progress } = useVideoContext()
  const [notes, setNotes] = useState([])
  const [search, setSearch] = useState('')
  // use ref to detect when a project is switch and notes are reset to avoid additional call to update state when listening to notes changes
  const isLoadingNotesRef = useRef(true)

  const { currentNote, checkProximity } = useNoteProximity({ notes, progress })
  const isMount = useIsMount()

  // when a project is selected pre-fill the notes
  useEffect(() => {
    if (project !== null) {
      setNotes(project.notes)
      isLoadingNotesRef.current = true
    }
  }, [project])

  // when notes amount changes then update so we have access to total notes
  // we don't update project state since we will always load from api the data whenever switching
  useEffect(() => {
    if (isMount) return
    if (project === null) return
    // 'isLoadingNotes' means this is initial update from project.notes and we don't need to update state back to 'projects'
    if (isLoadingNotesRef.current) {
      isLoadingNotesRef.current = false
      return
    }
    if (notes.length === project.notes.length) return
    console.log('update project state, notes: ', notes)
    console.log('project notes', project.notes)
    updateProjectsStateWithUpdatedNotes(notes)
  }, [isMount, notes, project])

  // when there are no projects present make sure state is reset
  useEffect(() => {
    if (projects.length > 0) return
    setNotes([])
    setSearch('')
  }, [projects])

  const addNote = note => {
    const newNote = {
      _id: createMongooseId(),
      content: note.content,
      time: note.time,
      done: false,
      project: project._id,
    }
    console.log({ newNote })
    setNotes([...notes, newNote])
    noteApi(newNote).then(responseNote => {
      if (responseNote === 'error') {
        // remove newly added note
        setNotes(current => {
          return current.filter(note => note._id !== newNote._id)
        })
      }
      console.log({ responseNote })
    })
  }

  const updateNote = note => {
    const oldNote = notes.find(n => n._id === note._id)
    console.log('update the note', note)
    noteApi(note).then(res => {
      if (res === 'error') {
        // if we have server error return original note
        return updateNoteState(oldNote)
      } else {
        // otherwise the response will be the updated note
        updateNoteState(res)
      }
    })
  }

  const updateNoteState = updatedNote => {
    setNotes(current => {
      return notes.map(note => {
        return updatedNote._id === note._id ? updatedNote : note
      })
    })
  }

  const removeNote = _id => {
    const updatedNotes = notes.filter(note => note._id !== _id)
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

  const removeCompleted = async () => {
    // * we wait for server response before setting state, this is different to standard single note crud operations
    const updatedNotes = await noteApiRemoveDoneNotes()
    setNotes(updatedNotes)
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
