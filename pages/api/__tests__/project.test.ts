import { createMocks } from 'node-mocks-http'
import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '../project'

// Mock dependencies
jest.mock('@/utils/jwt', () => ({
  authenticateToken: jest.fn(),
  generateAccessToken: jest.fn(),
}))

const mockProjectDoc = {
  _id: 'project123',
  title: 'Test Project',
  src: 'https://example.com/video.mp4',
  user: 'user123',
  notes: [],
  share: null,
  save: jest.fn(),
  remove: jest.fn(),
  toObject: jest.fn(),
}

const mockUserDoc = {
  _id: 'user123',
  email: 'test@example.com',
  projects: {
    push: jest.fn(),
    pull: jest.fn(),
  },
  save: jest.fn(),
}

jest.mock('@/utils/mongoose', () => ({
  User: {
    findOne: jest.fn(),
  },
  Project: Object.assign(
    jest.fn().mockImplementation((data) => ({
      ...mockProjectDoc,
      ...data,
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn().mockReturnValue({ ...mockProjectDoc, ...data }),
    })),
    {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findById: jest.fn(),
    }
  ),
  Note: {
    deleteMany: jest.fn(),
  },
  Share: {
    findById: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
  },
}))

import { authenticateToken, generateAccessToken } from '@/utils/jwt'
import { User, Project, Note, Share } from '@/utils/mongoose'

const mockAuthenticateToken = authenticateToken as jest.Mock
const mockGenerateAccessToken = generateAccessToken as jest.Mock
const mockUserFindOne = User.findOne as jest.Mock
const mockProjectFindOne = (Project as any).findOne as jest.Mock
const mockProjectFindOneAndUpdate = (Project as any).findOneAndUpdate as jest.Mock

describe('/api/project', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockProjectDoc.save.mockReset()
    mockProjectDoc.remove.mockReset()
    mockProjectDoc.toObject.mockReturnValue(mockProjectDoc)
    mockUserDoc.save.mockReset()
    mockUserDoc.projects.push.mockReset()
    mockUserDoc.projects.pull.mockReset()
  })

  describe('authentication', () => {
    it('returns 401 when no authorization header is provided', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toEqual({
        msg: 'No token. Authorization denied.',
      })
    })

    it('returns 401 when token is invalid', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer invalid-token',
        },
        body: {},
      })

      mockAuthenticateToken.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toEqual({
        msg: 'Invalid token',
      })
    })
  })

  describe('action validation', () => {
    it('returns 400 when no action is specified', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {},
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        msg: 'Action not specified',
      })
    })
  })

  describe('GET action', () => {
    it('returns project with populated notes and share', async () => {
      const populatedProject = {
        ...mockProjectDoc,
        notes: [{ _id: 'note1', content: 'Test note' }],
        toObject: jest.fn().mockReturnValue({
          ...mockProjectDoc,
          notes: [{ _id: 'note1', content: 'Test note' }],
        }),
      }

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          action: 'GET',
          project: { _id: 'project123' },
        },
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)
      mockProjectFindOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(populatedProject),
      })
      mockGenerateAccessToken.mockReturnValue('new-token')

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.project).toBeDefined()
      expect(data.token).toBe('new-token')
    })
  })

  describe('CREATE action', () => {
    it('creates a new project and adds to user', async () => {
      const newProject = {
        title: 'New Project',
        src: 'https://example.com/new.mp4',
      }

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          action: 'CREATE',
          project: newProject,
        },
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)
      mockGenerateAccessToken.mockReturnValue('new-token')

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(mockUserDoc.projects.push).toHaveBeenCalled()
      expect(mockUserDoc.save).toHaveBeenCalled()
    })
  })

  describe('UPDATE action', () => {
    it('updates project with new data', async () => {
      const updatedProject = {
        ...mockProjectDoc,
        title: 'Updated Title',
        toObject: jest.fn().mockReturnValue({
          ...mockProjectDoc,
          title: 'Updated Title',
        }),
      }

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          action: 'UPDATE',
          project: { _id: 'project123', title: 'Updated Title' },
        },
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)
      mockProjectFindOneAndUpdate.mockResolvedValue(updatedProject)
      mockGenerateAccessToken.mockReturnValue('new-token')

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(mockProjectFindOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'project123', user: 'user123' },
        { $set: { title: 'Updated Title' } },
        { new: true }
      )
    })
  })

  describe('REMOVE action', () => {
    it('removes project and all associated data', async () => {
      const projectToRemove = {
        ...mockProjectDoc,
        remove: jest.fn().mockResolvedValue(undefined),
      }

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          action: 'REMOVE',
          project: { _id: 'project123' },
        },
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)
      mockProjectFindOne.mockResolvedValue(projectToRemove)
      mockGenerateAccessToken.mockReturnValue('new-token')

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(Note.deleteMany).toHaveBeenCalledWith({ project: 'project123' })
      expect(Share.deleteMany).toHaveBeenCalledWith({ project: 'project123' })
      expect(mockUserDoc.projects.pull).toHaveBeenCalledWith('project123')
      expect(projectToRemove.remove).toHaveBeenCalled()
    })
  })

  describe('SHARE action', () => {
    it('creates a new share when project has no existing share', async () => {
      const projectWithoutShare = {
        ...mockProjectDoc,
        share: null,
        save: jest.fn().mockResolvedValue(undefined),
      }

      const createdShare = {
        _id: 'share123',
        url: 'test-share-url',
        password: '',
        canEdit: true,
      }

      const populatedProject = {
        ...projectWithoutShare,
        share: createdShare,
        toObject: jest.fn().mockReturnValue({
          ...mockProjectDoc,
          share: createdShare,
        }),
      }

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          action: 'SHARE',
          project: { _id: 'project123' },
          share: { url: 'test-share-url', password: '', canEdit: true },
        },
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)
      mockProjectFindOne.mockResolvedValue(projectWithoutShare)
      ;(Share.create as jest.Mock).mockResolvedValue(createdShare)
      ;(Project.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(populatedProject),
        }),
      })
      mockGenerateAccessToken.mockReturnValue('new-token')

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(Share.create).toHaveBeenCalledWith({
        url: 'test-share-url',
        password: '',
        canEdit: true,
        project: 'project123',
        user: 'user123',
      })
    })

    it('updates existing share when project already has share', async () => {
      const existingShare = {
        _id: 'share123',
        url: 'old-url',
        password: '',
        updateOne: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
      }

      const projectWithShare = {
        ...mockProjectDoc,
        share: 'share123',
      }

      const updatedProject = {
        ...projectWithShare,
        share: { ...existingShare, url: 'new-url' },
        toObject: jest.fn().mockReturnValue({
          ...mockProjectDoc,
          share: { _id: 'share123', url: 'new-url' },
        }),
      }

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          action: 'SHARE',
          project: { _id: 'project123' },
          share: { url: 'new-url', password: '', canEdit: true },
        },
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)
      mockProjectFindOne
        .mockResolvedValueOnce(projectWithShare)
        .mockReturnValueOnce({
          populate: jest.fn().mockResolvedValue(updatedProject),
        })
      ;(Share.findById as jest.Mock).mockResolvedValue(existingShare)
      mockGenerateAccessToken.mockReturnValue('new-token')

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(existingShare.updateOne).toHaveBeenCalledWith({
        $set: { url: 'new-url', password: '', canEdit: true },
      })
    })

    it('hashes password when creating share with password', async () => {
      const projectWithoutShare = {
        ...mockProjectDoc,
        share: null,
        save: jest.fn().mockResolvedValue(undefined),
      }

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          action: 'SHARE',
          project: { _id: 'project123' },
          share: { url: 'test-url', password: 'secret123', canEdit: true },
        },
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)
      mockProjectFindOne.mockResolvedValue(projectWithoutShare)
      ;(Share.create as jest.Mock).mockResolvedValue({ _id: 'share123' })
      ;(Project.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            ...projectWithoutShare,
            toObject: jest.fn().mockReturnValue(mockProjectDoc),
          }),
        }),
      })
      mockGenerateAccessToken.mockReturnValue('new-token')

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      // Password should have been hashed (not the original)
      expect((Share.create as jest.Mock).mock.calls[0][0].password).not.toBe('secret123')
      expect((Share.create as jest.Mock).mock.calls[0][0].password.length).toBeGreaterThan(10)
    })

    it('returns 500 when share URL is already taken', async () => {
      const projectWithoutShare = {
        ...mockProjectDoc,
        share: null,
      }

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          action: 'SHARE',
          project: { _id: 'project123' },
          share: { url: 'duplicate-url', password: '', canEdit: true },
        },
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)
      mockProjectFindOne.mockResolvedValue(projectWithoutShare)
      ;(Share.create as jest.Mock).mockRejectedValue(new Error('Duplicate key'))

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData()).msg).toBe('Specified share project url is taken.')
    })
  })

  describe('REMOVE_SHARE action', () => {
    it('removes share and clears project reference', async () => {
      const projectWithShare = {
        ...mockProjectDoc,
        share: 'share123',
        save: jest.fn().mockResolvedValue(undefined),
      }

      const projectAfterRemoval = {
        ...mockProjectDoc,
        share: null,
        toObject: jest.fn().mockReturnValue({ ...mockProjectDoc, share: null }),
      }

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          action: 'REMOVE SHARE',
          project: { _id: 'project123' },
          share: { _id: 'share123' },
        },
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)
      mockProjectFindOne
        .mockResolvedValueOnce(projectWithShare)
        .mockReturnValueOnce({
          populate: jest.fn().mockResolvedValue(projectAfterRemoval),
        })
      mockGenerateAccessToken.mockReturnValue('new-token')

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(Share.deleteOne).toHaveBeenCalledWith({
        _id: 'share123',
        user: 'user123',
        project: 'project123',
      })
      expect(projectWithShare.save).toHaveBeenCalled()
    })

    it('returns new token after removing share', async () => {
      const projectWithShare = {
        ...mockProjectDoc,
        share: 'share123',
        save: jest.fn().mockResolvedValue(undefined),
      }

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          action: 'REMOVE SHARE',
          project: { _id: 'project123' },
          share: { _id: 'share123' },
        },
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)
      mockProjectFindOne
        .mockResolvedValueOnce(projectWithShare)
        .mockReturnValueOnce({
          populate: jest.fn().mockResolvedValue({
            ...mockProjectDoc,
            toObject: jest.fn().mockReturnValue(mockProjectDoc),
          }),
        })
      mockGenerateAccessToken.mockReturnValue('refreshed-token')

      await handler(req, res)

      expect(mockGenerateAccessToken).toHaveBeenCalledWith('test@example.com')
      expect(JSON.parse(res._getData()).token).toBe('refreshed-token')
    })
  })

  describe('token refresh', () => {
    it('includes new token in response', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          action: 'GET',
          project: { _id: 'project123' },
        },
      })

      mockAuthenticateToken.mockReturnValue('test@example.com')
      mockUserFindOne.mockResolvedValue(mockUserDoc)
      mockProjectFindOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockProjectDoc,
          toObject: jest.fn().mockReturnValue(mockProjectDoc),
        }),
      })
      mockGenerateAccessToken.mockReturnValue('refreshed-token')

      await handler(req, res)

      expect(mockGenerateAccessToken).toHaveBeenCalledWith('test@example.com')
      expect(JSON.parse(res._getData()).token).toBe('refreshed-token')
    })
  })
})
