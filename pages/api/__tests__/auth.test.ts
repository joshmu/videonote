import { createMocks } from 'node-mocks-http'
import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '../auth'

// Mock dependencies
jest.mock('@/utils/jwt', () => ({
  authenticateToken: jest.fn(),
}))

jest.mock('@/utils/mongoose', () => ({
  User: {
    findOne: jest.fn(),
  },
}))

jest.mock('@/utils/apiHelpers', () => ({
  extractUser: jest.fn((user) => {
    if (!user) return null
    const { password, created, ...data } = user
    return data
  }),
}))

import { authenticateToken } from '@/utils/jwt'
import { User } from '@/utils/mongoose'

const mockAuthenticateToken = authenticateToken as jest.Mock
const mockUserFindOne = User.findOne as jest.Mock

describe('/api/auth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when no authorization header is provided', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
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
    })

    mockAuthenticateToken.mockRejectedValue(new Error('Invalid token'))

    await handler(req, res)

    expect(res._getStatusCode()).toBe(401)
    expect(JSON.parse(res._getData())).toEqual({
      msg: 'Invalid token',
    })
  })

  it('returns 400 when user is not found', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-token',
      },
    })

    mockAuthenticateToken.mockResolvedValue('test@example.com')
    mockUserFindOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      msg: 'No user found.',
    })
  })

  it('returns 200 with user data for valid token', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashedpassword',
      created: '2020-01-01',
      role: 'free',
      settings: { theme: 'dark' },
      projects: [],
    }

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-token',
      },
    })

    mockAuthenticateToken.mockResolvedValue('test@example.com')
    mockUserFindOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockUser),
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe('test@example.com')
    expect(data.user.password).toBeUndefined()
  })

  it('strips "Bearer " prefix from authorization header (case insensitive)', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashedpassword',
      created: '2020-01-01',
    }

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: {
        authorization: 'BEARER my-token',
      },
    })

    mockAuthenticateToken.mockResolvedValue('test@example.com')
    mockUserFindOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockUser),
    })

    await handler(req, res)

    expect(mockAuthenticateToken).toHaveBeenCalledWith('my-token')
  })

  it('calls User.findOne with correct email', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'findme@example.com',
      username: 'testuser',
      password: 'hashedpassword',
      created: '2020-01-01',
    }

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-token',
      },
    })

    mockAuthenticateToken.mockResolvedValue('findme@example.com')
    mockUserFindOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockUser),
    })

    await handler(req, res)

    expect(mockUserFindOne).toHaveBeenCalledWith({ email: 'findme@example.com' })
  })
})
