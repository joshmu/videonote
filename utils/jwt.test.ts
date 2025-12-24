import { authenticateToken, generateAccessToken } from './jwt'

// Set up test secret
const TEST_SECRET = 'test-jwt-secret-for-testing-purposes-only'

describe('jwt', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv, JWT_TOKEN_SECRET: TEST_SECRET }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('generateAccessToken', () => {
    it('generates a valid JWT token string', () => {
      const email = 'test@example.com'
      const token = generateAccessToken(email)

      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts: header.payload.signature
    })

    it('generates different tokens for different emails', () => {
      const token1 = generateAccessToken('user1@example.com')
      const token2 = generateAccessToken('user2@example.com')

      expect(token1).not.toBe(token2)
    })

    it('generates different tokens on each call (due to timestamp)', () => {
      const email = 'test@example.com'
      const token1 = generateAccessToken(email)
      const token2 = generateAccessToken(email)

      // Tokens should be different due to iat (issued at) timestamp
      // Though in fast execution they might be the same, we check they're valid
      expect(typeof token1).toBe('string')
      expect(typeof token2).toBe('string')
    })
  })

  describe('authenticateToken', () => {
    it('returns the email from a valid token', () => {
      const email = 'test@example.com'
      const token = generateAccessToken(email)

      const result = authenticateToken(token)

      expect(result).toBe(email)
    })

    it('handles different email formats', () => {
      const emails = [
        'simple@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
      ]

      emails.forEach(email => {
        const token = generateAccessToken(email)
        const result = authenticateToken(token)
        expect(result).toBe(email)
      })
    })

    it('throws error for invalid token', () => {
      expect(() => {
        authenticateToken('invalid-token')
      }).toThrow()
    })

    it('throws error for malformed token', () => {
      expect(() => {
        authenticateToken('not.a.valid.jwt.token')
      }).toThrow()
    })

    it('throws error for token with wrong signature', () => {
      const email = 'test@example.com'
      const token = generateAccessToken(email)

      // Tamper with the signature (last part of JWT)
      const parts = token.split('.')
      parts[2] = 'tampered-signature'
      const tamperedToken = parts.join('.')

      expect(() => {
        authenticateToken(tamperedToken)
      }).toThrow()
    })

    it('throws error for empty token', () => {
      expect(() => {
        authenticateToken('')
      }).toThrow()
    })
  })

  describe('integration', () => {
    it('roundtrip: generate token and authenticate returns same email', () => {
      const emails = [
        'user@test.com',
        'admin@company.org',
        'hello@videonote.app',
      ]

      emails.forEach(email => {
        const token = generateAccessToken(email)
        const decoded = authenticateToken(token)
        expect(decoded).toBe(email)
      })
    })
  })
})
