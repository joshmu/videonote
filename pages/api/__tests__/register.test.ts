import { createMocks } from 'node-mocks-http'
import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '../register'

// Mock dependencies
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}))

jest.mock('@/utils/jwt', () => ({
  generateAccessToken: jest.fn(),
}))

// Create a mock user instance
const mockUserInstance = {
  email: '',
  username: '',
  password: '',
  save: jest.fn(),
  toObject: jest.fn(),
}

jest.mock('@/utils/mongoose', () => ({
  User: Object.assign(
    jest.fn().mockImplementation((data) => {
      mockUserInstance.email = data.email
      mockUserInstance.username = data.username
      mockUserInstance.password = data.password
      return mockUserInstance
    }),
    {
      countDocuments: jest.fn(),
    }
  ),
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

const mockBcryptHash = bcrypt.hash as jest.Mock
const mockGenerateAccessToken = generateAccessToken as jest.Mock
const mockUserCountDocuments = (User as any).countDocuments as jest.Mock

describe('/api/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUserInstance.save.mockReset()
    mockUserInstance.toObject.mockReset()
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
      msg: 'The email you entered is invalid.',
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

  it('returns 403 when email already exists', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'existing@example.com',
        password: 'password123',
      },
    })

    mockUserCountDocuments.mockResolvedValue(1)

    await handler(req, res)

    expect(res._getStatusCode()).toBe(403)
    expect(JSON.parse(res._getData())).toEqual({
      msg: 'The email has already been used.',
    })
  })

  it('returns 201 with user and token on successful registration', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'newuser@example.com',
        password: 'password123',
      },
    })

    mockUserCountDocuments.mockResolvedValue(0)
    mockBcryptHash.mockResolvedValue('hashed-password')
    mockUserInstance.save.mockResolvedValue(undefined)
    mockUserInstance.toObject.mockReturnValue({
      _id: 'user123',
      email: 'newuser@example.com',
      username: 'newuser@example.com',
      password: 'hashed-password',
      created: '2020-01-01',
    })
    mockGenerateAccessToken.mockReturnValue('new-user-token')

    await handler(req, res)

    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(data.token).toBe('new-user-token')
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe('newuser@example.com')
    expect(data.user.password).toBeUndefined()
  })

  it('hashes password with bcrypt using salt rounds of 10', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'mypassword',
      },
    })

    mockUserCountDocuments.mockResolvedValue(0)
    mockBcryptHash.mockResolvedValue('hashed')
    mockUserInstance.save.mockResolvedValue(undefined)
    mockUserInstance.toObject.mockReturnValue({
      email: 'test@example.com',
      username: 'test@example.com',
      password: 'hashed',
    })
    mockGenerateAccessToken.mockReturnValue('token')

    await handler(req, res)

    expect(mockBcryptHash).toHaveBeenCalledWith('mypassword', 10)
  })

  it('sets username to email by default', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'username@example.com',
        password: 'password123',
      },
    })

    mockUserCountDocuments.mockResolvedValue(0)
    mockBcryptHash.mockResolvedValue('hashed')
    mockUserInstance.save.mockResolvedValue(undefined)
    mockUserInstance.toObject.mockReturnValue({
      email: 'username@example.com',
      username: 'username@example.com',
      password: 'hashed',
    })
    mockGenerateAccessToken.mockReturnValue('token')

    await handler(req, res)

    expect(mockUserInstance.username).toBe('username@example.com')
  })

  it('returns 500 when database save fails', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    })

    mockUserCountDocuments.mockResolvedValue(0)
    mockBcryptHash.mockResolvedValue('hashed')
    mockUserInstance.save.mockRejectedValue(new Error('Database error'))

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      msg: 'Database Error',
    })
  })

  it('normalizes email before checking and saving', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      },
    })

    mockUserCountDocuments.mockResolvedValue(0)
    mockBcryptHash.mockResolvedValue('hashed')
    mockUserInstance.save.mockResolvedValue(undefined)
    mockUserInstance.toObject.mockReturnValue({
      email: 'test@example.com',
      username: 'test@example.com',
      password: 'hashed',
    })
    mockGenerateAccessToken.mockReturnValue('token')

    await handler(req, res)

    expect(mockUserCountDocuments).toHaveBeenCalledWith({ email: 'test@example.com' })
    expect(mockUserInstance.email).toBe('test@example.com')
  })
})
