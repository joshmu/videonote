import { createMocks } from 'node-mocks-http'
import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '../login'

// Mock dependencies
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}))

jest.mock('@/utils/jwt', () => ({
  generateAccessToken: jest.fn(),
}))

jest.mock('@/utils/mongoose', () => ({
  User: {
    countDocuments: jest.fn(),
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

import bcrypt from 'bcryptjs'
import { generateAccessToken } from '@/utils/jwt'
import { User } from '@/utils/mongoose'

const mockBcryptCompare = bcrypt.compare as jest.Mock
const mockGenerateAccessToken = generateAccessToken as jest.Mock
const mockUserCountDocuments = User.countDocuments as jest.Mock
const mockUserFindOne = User.findOne as jest.Mock

describe('/api/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 for invalid email format', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'invalid-email',
        password: 'password123',
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      msg: 'Your Email and/or Password is incorrect.',
    })
  })

  it('returns 400 when password is missing', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'test@example.com',
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      msg: 'Missing field(s)',
    })
  })

  it('returns 404 when user does not exist', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'nonexistent@example.com',
        password: 'password123',
      },
    })

    mockUserCountDocuments.mockResolvedValue(0)

    await handler(req, res)

    expect(res._getStatusCode()).toBe(404)
    expect(JSON.parse(res._getData())).toEqual({
      msg: 'Your Email and/or Password is incorrect.',
    })
  })

  it('returns 401 when password is incorrect', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      password: 'hashedpassword',
    }

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'wrongpassword',
      },
    })

    mockUserCountDocuments.mockResolvedValue(1)
    mockUserFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockUser),
    })
    mockBcryptCompare.mockResolvedValue(false)

    await handler(req, res)

    expect(res._getStatusCode()).toBe(401)
    expect(JSON.parse(res._getData())).toEqual({
      msg: 'Your Email and/or Password is incorrect.',
    })
  })

  it('returns 302 with token for valid credentials', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashedpassword',
      created: '2020-01-01',
    }

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'correctpassword',
      },
    })

    mockUserCountDocuments.mockResolvedValue(1)
    mockUserFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockUser),
    })
    mockBcryptCompare.mockResolvedValue(true)
    mockGenerateAccessToken.mockReturnValue('generated-jwt-token')

    await handler(req, res)

    expect(res._getStatusCode()).toBe(302)
    const data = JSON.parse(res._getData())
    expect(data.token).toBe('generated-jwt-token')
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe('test@example.com')
    expect(data.user.password).toBeUndefined()
  })

  it('calls bcrypt.compare with correct arguments', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      password: 'stored-hash',
    }

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'user-input-password',
      },
    })

    mockUserCountDocuments.mockResolvedValue(1)
    mockUserFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockUser),
    })
    mockBcryptCompare.mockResolvedValue(true)
    mockGenerateAccessToken.mockReturnValue('token')

    await handler(req, res)

    expect(mockBcryptCompare).toHaveBeenCalledWith('user-input-password', 'stored-hash')
  })

  it('generates token with user email', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'tokenuser@example.com',
      password: 'hashedpassword',
    }

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'tokenuser@example.com',
        password: 'password',
      },
    })

    mockUserCountDocuments.mockResolvedValue(1)
    mockUserFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockUser),
    })
    mockBcryptCompare.mockResolvedValue(true)
    mockGenerateAccessToken.mockReturnValue('token')

    await handler(req, res)

    expect(mockGenerateAccessToken).toHaveBeenCalledWith('tokenuser@example.com')
  })

  it('normalizes email before lookup', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'TEST@EXAMPLE.COM',
        password: 'password',
      },
    })

    mockUserCountDocuments.mockResolvedValue(0)

    await handler(req, res)

    // normalizeEmail lowercases the email
    expect(mockUserCountDocuments).toHaveBeenCalledWith({ email: 'test@example.com' })
  })
})
