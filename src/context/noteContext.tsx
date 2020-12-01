/**
 * @path /src/context/noteContext.tsx
 *
 * @project videonote
 * @file noteContext.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Tuesday, 1st December 2020 12:27:20 pm
 * @copyright © 2020 - 2020 MU
 */

import mongoose from 'mongoose'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

import { useIsMount } from '@/hooks/useIsMount'
import { useNoteProximity } from '@/hooks/useNoteProximity'
import { NoteInterface } from '@/root/src/components/shared/types'

import { useGlobalContext } from './globalContext'
import { useVideoContext } from './videoContext'

const createMongooseId = () => new mongoose.Types.ObjectId().toString()

type AddNoteType = (
  note: NoteInterface | { content: string; time: number }
) => void
type UpdateNoteType = (note: NoteInterface) => void
type RemoveNoteType = (id: string) => void
type UpdateSearchType = (txt: string) => void
type SortType = (notes: NoteInterface[]) => NoteInterface[]
type RemoveCompletedType = () => void
interface NoteContextInterface {
  notes: NoteInterface[]
  addNote: AddNoteType
  updateNote: UpdateNoteType
  removeNote: RemoveNoteType
  updateSearch: UpdateSearchType
  sort: SortType
  search: string
  removeCompleted: RemoveCompletedType
  checkProximity: (note: NoteInterface) => boolean
  currentNote: NoteInterface | null
  notesExist: boolean
}

const noteContext = createContext<NoteContextInterface>(null!)

export function NoteProvider(props: { [key: string]: any }) {
  const {
    project,
    projects,
    noteApi,
    noteApiRemoveDoneNotes,
    updateProjectsStateWithUpdatedNotes,
    checkCanEdit,
    user,
  } = useGlobalContext()
  const { progress } = useVideoContext()
  const [notes, setNotes] = useState<NoteInterface[]>([])
  const [search, setSearch] = useState<string>('')
  // use ref to detect when a project is switch and notes are reset to avoid additional call to update state when listening to notes changes
  const isLoadingNotesRef = useRef<boolean>(true)

  const { currentNote, checkProximity } = useNoteProximity({ notes, progress })
  const isMount = useIsMount()

  // when a project is selected pre-fill the notes
  useEffect(() => {
    if (project !== null) {
      setNotes(project.notes as NoteInterface[])
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

  // * addNote data flow updates state and redacts change if server responds with an error updating the db
  const addNote: AddNoteType = note => {
    if (!checkCanEdit()) return

    const newNote: NoteInterface = {
      _id: createMongooseId(),
      content: note.content,
      time: note.time,
      done: false,
      project: project._id,
    }
    // add user information if we have it
    if (user?._id) newNote.user = user._id

    // temp flag for current user to detect their own notes if we have no user information
    // * this is not saved to the db
    newNote.currentSession = true

    console.log({ newNote })
    setNotes([...notes, newNote])
    noteApi(newNote).then((responseNote: NoteInterface | 'error') => {
      if (responseNote === 'error') {
        // remove newly added note
        setNotes(current => {
          return current.filter(note => note._id !== newNote._id)
        })
      }
      console.log({ responseNote })
    })
  }

  const updateNote: UpdateNoteType = note => {
    const oldNote = notes.find(n => n._id === note._id)
    console.log('update the note', note)
    noteApi(note).then((res: 'error') => {
      if (res === 'error') {
        // if we have server error return original note
        return updateNoteState(oldNote)
      } else {
        // otherwise the response will be the updated note
        updateNoteState(res)
      }
    })
  }

  const updateNoteState = (updatedNote: NoteInterface): void => {
    setNotes(() => {
      return notes.map(note => {
        return updatedNote._id === note._id ? updatedNote : note
      })
    })
  }

  const removeNote = (_id: string): void => {
    const updatedNotes = notes.filter(note => note._id !== _id)
    setNotes(updatedNotes)
  }

  const updateSearch: UpdateSearchType = txt => {
    setSearch(txt)
  }

  const sort: SortType = notes => {
    // default is to sort chronologically
    let sorted = notes.sort((p, c) => p.time - c.time)

    // search
    if (search !== '') {
      sorted = sorted.filter(note => note.content.includes(search))
    }

    return sorted
  }

  const removeCompleted: RemoveCompletedType = async () => {
    // * we wait for server response before setting state, this is different to standard single note crud operations
    const updatedNotes = await noteApiRemoveDoneNotes()
    setNotes(updatedNotes)
  }

  const notesExist: boolean = notes.length > 0

  const value: NoteContextInterface = {
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
    notesExist,
  }

  return <noteContext.Provider value={value} {...props} />
}

export const useNoteContext = (): NoteContextInterface => {
  return useContext(noteContext)
}
