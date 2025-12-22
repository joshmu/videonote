import { createMocks } from 'node-mocks-http'
import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '../note'

// Mock dependencies
jest.mock('@/utils/jwt', () => ({
  authenticateToken: jest.fn(),
  generateAccessToken: jest.fn(),
}))

const mockNoteDoc = {
  _id: 'note123',
  content: 'Test note content',
  time: 30,
  done: false,
  project: 'project123',
  user: 'user123',
  save: jest.fn(),
  updateOne: jest.fn(),
  populate: jest.fn(),
  populated: jest.fn(),
  toObject: jest.fn(),
}

const mockUserDoc = {
  _id: 'user123',
  email: 'test@example.com',
}

const mockProjectDoc = {
  _id: 'project123',
  notes: {
    push: jest.fn(),
  },
  save: jest.fn(),
}

jest.mock('@/utils/mongoose', () => ({
  User: {
    findOne: jest.fn(),
  },
  Project: {
    findById: jest.fn(),
  },
  Note: Object.assign(
    jest.fn().mockImplementation((data) => ({
      ...mockNoteDoc,
      ...data,
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn().mockReturnValue({ ...mockNoteDoc, ...data }),
      populated: jest.fn().mockReturnValue(false),
      populate: jest.fn().mockResolvedValue(undefined),
    })),
    {
      findById: jest.fn(),
      find: jest.fn(),
      deleteMany: jest.fn(),
    }
  ),
}))

import { authenticateToken, generateAccessToken } from '@/utils/jwt'
import { User, Project, Note } from '@/utils/mongoose'

const mockAuthenticateToken = authenticateToken as jest.Mock
const mockGenerateAccessToken = generateAccessToken as jest.Mock
const mockUserFindOne = User.findOne as jest.Mock
const mockNoteFindById = (Note as any).findById as jest.Mock
const mockNoteFind = (Note as any).find as jest.Mock
const mockNoteDeleteMany = (Note as any).deleteMany as jest.Mock
const mockProjectFindById = Project.findById as jest.Mock

describe('/api/note', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNoteDoc.save.mockReset()
    mockNoteDoc.updateOne.mockReset()
    mockNoteDoc.populate.mockReset()
    mockNoteDoc.populated.mockReturnValue(false)
    mockNoteDoc.toObject.mockReturnValue(mockNoteDoc)
    mockProjectDoc.save.mockReset()
    mockProjectDoc.notes.push.mockReset()
  })

  describe('authentication', () => {
    it('allows guest users without token', async () => {
      const noteData = {
        _id: 'newNote123',
        content: 'Guest note',
        time: 0,
        project: 'project123',
      }

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          note: noteData,
        },
      })

      mockNoteFindById.mockResolvedValue(null) // Note doesn't exist, create new
      mockProjectFindById.mockResolvedValue(mockProjectDoc)

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      // Guest users should not get a token
      expect(JSON.parse(res._getData()).token).toBeNull()
    })

    it('returns 401 when token is invalid', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer invalid-token',
        },
        body: {
          note: { _id: 'note123', content: 'Updated' },
        },
      })

      mockAuthenticateToken.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toMatchObject({
        msg: 'Invalid token',
      })
    })

    it('authenticates valid token and returns new token', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          note: { _id: 'newNote456', content: 'Auth note', project: 'project123' },
        },
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)
      mockNoteFindById.mockResolvedValue(null)
      mockProjectFindById.mockResolvedValue(mockProjectDoc)
      mockGenerateAccessToken.mockReturnValue('new-token')

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(JSON.parse(res._getData()).token).toBe('new-token')
      expect(mockGenerateAccessToken).toHaveBeenCalledWith('test@example.com')
    })
  })

  describe('create note', () => {
    it('creates a new note when it does not exist', async () => {
      const noteData = {
        _id: 'newNote789',
        content: 'New note content',
        time: 45,
        project: 'project123',
      }

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          note: noteData,
        },
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)
      mockNoteFindById.mockResolvedValue(null) // Note doesn't exist
      mockProjectFindById.mockResolvedValue(mockProjectDoc)
      mockGenerateAccessToken.mockReturnValue('new-token')

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(mockProjectDoc.notes.push).toHaveBeenCalled()
      expect(mockProjectDoc.save).toHaveBeenCalled()
    })

    it('adds user ID to note for authenticated users', async () => {
      const noteData = {
        _id: 'newNoteWithUser',
        content: 'User note',
        time: 60,
        project: 'project123',
      }

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          note: noteData,
        },
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)
      mockNoteFindById.mockResolvedValue(null)
      mockProjectFindById.mockResolvedValue(mockProjectDoc)
      mockGenerateAccessToken.mockReturnValue('new-token')

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      // The note should have user ID assigned
      const data = JSON.parse(res._getData())
      expect(data.note).toBeDefined()
    })
  })

  describe('update note', () => {
    it('updates an existing note', async () => {
      const existingNote = {
        ...mockNoteDoc,
        updateOne: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
        populated: jest.fn().mockReturnValue(false),
        populate: jest.fn().mockResolvedValue(undefined),
        toObject: jest.fn().mockReturnValue({ ...mockNoteDoc, content: 'Updated content' }),
      }

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          note: { _id: 'note123', content: 'Updated content' },
        },
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)
      mockNoteFindById
        .mockResolvedValueOnce(existingNote) // First call - find existing
        .mockResolvedValueOnce(existingNote) // Second call - get updated
      mockGenerateAccessToken.mockReturnValue('new-token')

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(existingNote.updateOne).toHaveBeenCalledWith({
        $set: expect.objectContaining({ content: 'Updated content' }),
      })
      expect(existingNote.save).toHaveBeenCalled()
    })

    it('marks note as done when toggling', async () => {
      const existingNote = {
        ...mockNoteDoc,
        done: false,
        updateOne: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
        populated: jest.fn().mockReturnValue(false),
        populate: jest.fn().mockResolvedValue(undefined),
        toObject: jest.fn().mockReturnValue({ ...mockNoteDoc, done: true }),
      }

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          note: { _id: 'note123', done: true },
        },
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)
      mockNoteFindById
        .mockResolvedValueOnce(existingNote)
        .mockResolvedValueOnce(existingNote)
      mockGenerateAccessToken.mockReturnValue('new-token')

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(existingNote.updateOne).toHaveBeenCalledWith({
        $set: expect.objectContaining({ done: true }),
      })
    })
  })

  describe('REMOVE_DONE_NOTES action', () => {
    it('removes all done notes from project', async () => {
      const remainingNotes = [
        { _id: 'note1', content: 'Not done', done: false },
        { _id: 'note2', content: 'Also not done', done: false },
      ]

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          action: 'REMOVE DONE NOTES',
          projectId: 'project123',
        },
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)
      mockNoteDeleteMany.mockResolvedValue({ deletedCount: 3 })
      mockNoteFind.mockReturnValue({
        lean: jest.fn().mockResolvedValue(remainingNotes),
      })
      mockGenerateAccessToken.mockReturnValue('new-token')

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(mockNoteDeleteMany).toHaveBeenCalledWith({
        project: 'project123',
        done: true,
      })
      expect(JSON.parse(res._getData()).notes).toEqual(remainingNotes)
    })

    it('returns new token after removing done notes', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          action: 'REMOVE DONE NOTES',
          projectId: 'project123',
        },
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)
      mockNoteDeleteMany.mockResolvedValue({ deletedCount: 0 })
      mockNoteFind.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      })
      mockGenerateAccessToken.mockReturnValue('refreshed-token')

      await handler(req, res)

      expect(mockGenerateAccessToken).toHaveBeenCalledWith('test@example.com')
      expect(JSON.parse(res._getData()).token).toBe('refreshed-token')
    })
  })

  describe('error handling', () => {
    it('returns 500 on database error', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          note: { _id: 'note123', content: 'Test' },
        },
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)
      mockNoteFindById.mockRejectedValue(new Error('Database connection failed'))

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toMatchObject({
        msg: 'Database error',
      })
    })
  })
})
