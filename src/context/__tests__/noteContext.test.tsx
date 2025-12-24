import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { NoteProvider, useNoteContext } from '../noteContext'
import { NoteInterface } from '@/root/src/components/shared/types'

// Mock mongoose
jest.mock('mongoose', () => ({
  Types: {
    ObjectId: jest.fn().mockImplementation(() => ({
      toString: () => 'mock-note-id-' + Date.now(),
    })),
  },
}))

// Mock the hooks
jest.mock('@/hooks/useIsMount', () => ({
  useIsMount: jest.fn(() => false),
}))

const mockCheckProximity = jest.fn(() => false)
const mockCurrentNote: NoteInterface | null = null

jest.mock('@/hooks/useNoteProximity', () => ({
  useNoteProximity: jest.fn(() => ({
    checkProximity: mockCheckProximity,
    currentNote: mockCurrentNote,
  })),
}))

// Mock global context
const mockNoteApi = jest.fn()
const mockNoteApiRemoveDoneNotes = jest.fn()
const mockUpdateProjectsStateWithUpdatedNotes = jest.fn()
const mockCheckCanEdit = jest.fn()

const mockGlobalContextValues = {
  project: {
    _id: 'project123',
    notes: [],
  },
  projects: [],
  noteApi: mockNoteApi,
  noteApiRemoveDoneNotes: mockNoteApiRemoveDoneNotes,
  updateProjectsStateWithUpdatedNotes: mockUpdateProjectsStateWithUpdatedNotes,
  checkCanEdit: mockCheckCanEdit,
  user: null,
}

jest.mock('../globalContext', () => ({
  useGlobalContext: jest.fn(() => mockGlobalContextValues),
}))

// Mock video context
jest.mock('../videoContext', () => ({
  useVideoContext: jest.fn(() => ({
    progress: 0,
  })),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NoteProvider>{children}</NoteProvider>
)

describe('NoteContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGlobalContextValues.project = {
      _id: 'project123',
      notes: [],
    }
    mockGlobalContextValues.projects = []
    mockCheckCanEdit.mockReturnValue(true)
  })

  describe('initial state', () => {
    it('provides initial empty notes array', () => {
      const { result } = renderHook(() => useNoteContext(), { wrapper })
      expect(result.current.notes).toEqual([])
    })

    it('provides initial empty search string', () => {
      const { result } = renderHook(() => useNoteContext(), { wrapper })
      expect(result.current.search).toBe('')
    })

    it('notesExist is false when no notes', () => {
      const { result } = renderHook(() => useNoteContext(), { wrapper })
      expect(result.current.notesExist).toBe(false)
    })
  })

  describe('sort function', () => {
    it('sorts notes chronologically by time', () => {
      const { result } = renderHook(() => useNoteContext(), { wrapper })

      const unsortedNotes: NoteInterface[] = [
        { _id: '1', content: 'Third', time: 30, done: false, project: 'p1' },
        { _id: '2', content: 'First', time: 10, done: false, project: 'p1' },
        { _id: '3', content: 'Second', time: 20, done: false, project: 'p1' },
      ]

      const sorted = result.current.sort(unsortedNotes)

      expect(sorted[0].content).toBe('First')
      expect(sorted[1].content).toBe('Second')
      expect(sorted[2].content).toBe('Third')
    })

    it('filters notes by search term', () => {
      const { result } = renderHook(() => useNoteContext(), { wrapper })

      // Update search first
      act(() => {
        result.current.updateSearch('important')
      })

      const notes: NoteInterface[] = [
        { _id: '1', content: 'Regular note', time: 10, done: false, project: 'p1' },
        { _id: '2', content: 'This is important', time: 20, done: false, project: 'p1' },
        { _id: '3', content: 'Another important point', time: 30, done: false, project: 'p1' },
      ]

      const filtered = result.current.sort(notes)

      expect(filtered).toHaveLength(2)
      expect(filtered.every(n => n.content.includes('important'))).toBe(true)
    })

    it('returns all notes when search is empty', () => {
      const { result } = renderHook(() => useNoteContext(), { wrapper })

      const notes: NoteInterface[] = [
        { _id: '1', content: 'Note 1', time: 10, done: false, project: 'p1' },
        { _id: '2', content: 'Note 2', time: 20, done: false, project: 'p1' },
      ]

      const sorted = result.current.sort(notes)

      expect(sorted).toHaveLength(2)
    })
  })

  describe('updateSearch', () => {
    it('updates search state', () => {
      const { result } = renderHook(() => useNoteContext(), { wrapper })

      act(() => {
        result.current.updateSearch('test query')
      })

      expect(result.current.search).toBe('test query')
    })

    it('clears search when empty string provided', () => {
      const { result } = renderHook(() => useNoteContext(), { wrapper })

      act(() => {
        result.current.updateSearch('test')
      })

      act(() => {
        result.current.updateSearch('')
      })

      expect(result.current.search).toBe('')
    })
  })

  describe('addNote', () => {
    it('does not add note if checkCanEdit returns false', async () => {
      mockCheckCanEdit.mockReturnValue(false)

      const { result } = renderHook(() => useNoteContext(), { wrapper })

      act(() => {
        result.current.addNote({ content: 'Test note', time: 10 })
      })

      expect(result.current.notes).toHaveLength(0)
      expect(mockNoteApi).not.toHaveBeenCalled()
    })

    it('adds note optimistically when checkCanEdit returns true', async () => {
      mockCheckCanEdit.mockReturnValue(true)
      mockNoteApi.mockResolvedValue({ _id: 'note123', content: 'Test note', time: 10 })

      const { result } = renderHook(() => useNoteContext(), { wrapper })

      act(() => {
        result.current.addNote({ content: 'Test note', time: 10 })
      })

      // Note should be added immediately (optimistic update)
      expect(result.current.notes).toHaveLength(1)
      expect(result.current.notes[0].content).toBe('Test note')
      expect(mockNoteApi).toHaveBeenCalled()
    })

    it('removes note if API returns error', async () => {
      mockCheckCanEdit.mockReturnValue(true)
      mockNoteApi.mockResolvedValue('error')

      const { result } = renderHook(() => useNoteContext(), { wrapper })

      await act(async () => {
        result.current.addNote({ content: 'Will fail', time: 10 })
        await Promise.resolve() // Let the promise resolve
      })

      // Note should be removed after error
      expect(result.current.notes).toHaveLength(0)
    })
  })

  describe('removeNote', () => {
    it('removes note from state by id', async () => {
      mockCheckCanEdit.mockReturnValue(true)
      mockNoteApi.mockResolvedValue({ _id: 'note123', content: 'Test', time: 10 })

      const { result } = renderHook(() => useNoteContext(), { wrapper })

      // First add a note
      await act(async () => {
        result.current.addNote({ content: 'Test', time: 10 })
      })

      const noteId = result.current.notes[0]._id

      act(() => {
        result.current.removeNote(noteId)
      })

      expect(result.current.notes).toHaveLength(0)
    })

    it('only removes specified note', async () => {
      mockCheckCanEdit.mockReturnValue(true)
      mockNoteApi.mockResolvedValue({ _id: 'note1', content: 'Note 1', time: 10 })

      const { result } = renderHook(() => useNoteContext(), { wrapper })

      // Add two notes
      await act(async () => {
        result.current.addNote({ content: 'Note 1', time: 10 })
      })

      mockNoteApi.mockResolvedValue({ _id: 'note2', content: 'Note 2', time: 20 })

      await act(async () => {
        result.current.addNote({ content: 'Note 2', time: 20 })
      })

      const firstNoteId = result.current.notes[0]._id

      act(() => {
        result.current.removeNote(firstNoteId)
      })

      expect(result.current.notes).toHaveLength(1)
      expect(result.current.notes[0].content).toBe('Note 2')
    })
  })

  describe('removeCompleted', () => {
    it('calls noteApiRemoveDoneNotes and updates state', async () => {
      const remainingNotes = [
        { _id: 'note1', content: 'Not done', time: 10, done: false, project: 'p1' },
      ]
      mockNoteApiRemoveDoneNotes.mockResolvedValue(remainingNotes)

      const { result } = renderHook(() => useNoteContext(), { wrapper })

      await act(async () => {
        await result.current.removeCompleted()
      })

      expect(mockNoteApiRemoveDoneNotes).toHaveBeenCalled()
      expect(result.current.notes).toEqual(remainingNotes)
    })
  })

  describe('checkProximity', () => {
    it('delegates to useNoteProximity hook', () => {
      mockCheckProximity.mockReturnValue(true)

      const { result } = renderHook(() => useNoteContext(), { wrapper })

      const testNote: NoteInterface = {
        _id: 'note1',
        content: 'Test',
        time: 10,
        done: false,
        project: 'p1',
      }

      const isProximate = result.current.checkProximity(testNote)

      expect(mockCheckProximity).toHaveBeenCalledWith(testNote)
      expect(isProximate).toBe(true)
    })
  })
})
