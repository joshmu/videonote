import {
  checkEmail,
  checkUsername,
  checkPassword,
  checkPasswordMatch,
  formatDuration,
  isValidCredentials,
} from './clientHelpers'

describe('clientHelpers', () => {
  describe('checkEmail', () => {
    it('returns true for valid emails', () => {
      expect(checkEmail('test@example.com')).toBe(true)
      expect(checkEmail('user.name@domain.co.uk')).toBe(true)
      expect(checkEmail('user+tag@example.org')).toBe(true)
    })

    it('returns false for invalid emails', () => {
      expect(checkEmail('invalid')).toBe(false)
      expect(checkEmail('@nodomain.com')).toBe(false)
      expect(checkEmail('missing@')).toBe(false)
      expect(checkEmail('')).toBe(false)
      expect(checkEmail('spaces in@email.com')).toBe(false)
    })
  })

  describe('checkUsername', () => {
    it('returns true for usernames longer than 5 characters', () => {
      expect(checkUsername('abcdef')).toBe(true) // 6 chars
      expect(checkUsername('validuser')).toBe(true)
    })

    it('returns false for usernames with 5 or fewer characters', () => {
      expect(checkUsername('abcde')).toBe(false) // 5 chars
      expect(checkUsername('abc')).toBe(false)
      expect(checkUsername('')).toBe(false)
    })
  })

  describe('checkPassword', () => {
    it('returns true for passwords longer than 5 characters', () => {
      expect(checkPassword('123456')).toBe(true) // 6 chars
      expect(checkPassword('securepassword')).toBe(true)
    })

    it('returns false for passwords with 5 or fewer characters', () => {
      expect(checkPassword('12345')).toBe(false) // 5 chars
      expect(checkPassword('abc')).toBe(false)
      expect(checkPassword('')).toBe(false)
    })
  })

  describe('checkPasswordMatch', () => {
    it('returns true when passwords match', () => {
      expect(checkPasswordMatch('password', 'password')).toBe(true)
      expect(checkPasswordMatch('', '')).toBe(true)
    })

    it('returns false when passwords do not match', () => {
      expect(checkPasswordMatch('password', 'different')).toBe(false)
      expect(checkPasswordMatch('Password', 'password')).toBe(false) // case sensitive
    })
  })

  describe('formatDuration', () => {
    it('formats zero seconds', () => {
      expect(formatDuration(0)).toBe('0:00')
    })

    it('formats seconds under a minute', () => {
      expect(formatDuration(5)).toBe('0:05')
      expect(formatDuration(59)).toBe('0:59')
    })

    it('formats exact minutes', () => {
      expect(formatDuration(60)).toBe('1:00')
      expect(formatDuration(120)).toBe('2:00')
    })

    it('formats minutes and seconds', () => {
      expect(formatDuration(65)).toBe('1:05')
      expect(formatDuration(90)).toBe('1:30')
      expect(formatDuration(125)).toBe('2:05')
    })

    it('formats large durations', () => {
      expect(formatDuration(3600)).toBe('60:00') // 1 hour
      expect(formatDuration(3661)).toBe('61:01')
    })

    it('handles decimal seconds by flooring', () => {
      expect(formatDuration(65.7)).toBe('1:05')
      expect(formatDuration(59.9)).toBe('0:59')
    })
  })

  describe('isValidCredentials', () => {
    const mockAddAlert = jest.fn()

    beforeEach(() => {
      mockAddAlert.mockClear()
    })

    it('returns true for valid credentials', () => {
      const result = isValidCredentials({
        email: 'test@example.com',
        username: 'validuser',
        password: 'password123',
        password2: 'password123',
        addAlert: mockAddAlert,
      })
      expect(result).toBe(true)
      expect(mockAddAlert).not.toHaveBeenCalled()
    })

    it('returns false and alerts for invalid email', () => {
      const result = isValidCredentials({
        email: 'invalid',
        username: 'validuser',
        password: 'password123',
        password2: 'password123',
        addAlert: mockAddAlert,
      })
      expect(result).toBe(false)
      expect(mockAddAlert).toHaveBeenCalledWith({
        type: 'error',
        msg: 'Email in invalid.',
      })
    })

    it('returns false and alerts for short username', () => {
      const result = isValidCredentials({
        email: 'test@example.com',
        username: 'abc',
        password: 'password123',
        password2: 'password123',
        addAlert: mockAddAlert,
      })
      expect(result).toBe(false)
      expect(mockAddAlert).toHaveBeenCalledWith({
        type: 'error',
        msg: 'Username must be at least 3 characters long',
      })
    })

    it('returns false and alerts for short password', () => {
      const result = isValidCredentials({
        email: 'test@example.com',
        username: 'validuser',
        password: '123',
        password2: '123',
        addAlert: mockAddAlert,
      })
      expect(result).toBe(false)
      expect(mockAddAlert).toHaveBeenCalledWith({
        type: 'error',
        msg: 'Password needs to be at least 5 characters long.',
      })
    })

    it('returns false and alerts for mismatched passwords', () => {
      const result = isValidCredentials({
        email: 'test@example.com',
        username: 'validuser',
        password: 'password123',
        password2: 'different123',
        addAlert: mockAddAlert,
      })
      expect(result).toBe(false)
      expect(mockAddAlert).toHaveBeenCalledWith({
        type: 'error',
        msg: 'Passwords do not match.',
      })
    })

    it('skips password validation when passwordRequired is false', () => {
      const result = isValidCredentials({
        email: 'test@example.com',
        username: 'validuser',
        password: '',
        passwordRequired: false,
        addAlert: mockAddAlert,
      })
      expect(result).toBe(true)
      expect(mockAddAlert).not.toHaveBeenCalled()
    })

    it('uses email as default username', () => {
      const result = isValidCredentials({
        email: 'test@example.com',
        password: 'password123',
        password2: 'password123',
        addAlert: mockAddAlert,
      })
      expect(result).toBe(true)
    })

    it('collects multiple validation errors', () => {
      const result = isValidCredentials({
        email: 'invalid',
        username: 'ab',
        password: '123',
        password2: '456',
        addAlert: mockAddAlert,
      })
      expect(result).toBe(false)
      expect(mockAddAlert).toHaveBeenCalledTimes(4)
    })
  })
})
