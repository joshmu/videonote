import {
  extractUser,
  extractProject,
  extractPublicProject,
} from './apiHelpers'

describe('apiHelpers', () => {
  describe('extractUser', () => {
    it('removes password and created fields from user object', () => {
      const user = {
        _id: '123',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword123',
        created: '2020-01-01T00:00:00.000Z',
        role: 'free',
      }
      const result = extractUser(user)
      expect(result).toEqual({
        _id: '123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'free',
      })
      expect(result).not.toHaveProperty('password')
      expect(result).not.toHaveProperty('created')
    })

    it('preserves all other user fields', () => {
      const user = {
        _id: '456',
        email: 'user@test.com',
        username: 'anotheruser',
        password: 'secret',
        created: '2020-06-15T12:00:00.000Z',
        role: 'paid',
        projects: ['proj1', 'proj2'],
        settings: { theme: 'dark' },
      }
      const result = extractUser(user)
      expect(result.projects).toEqual(['proj1', 'proj2'])
      expect(result.settings).toEqual({ theme: 'dark' })
      expect(result.role).toBe('paid')
    })

    it('returns null for null input', () => {
      const result = extractUser(null as any)
      expect(result).toBeNull()
    })

    it('returns null for undefined input', () => {
      const result = extractUser(undefined as any)
      expect(result).toBeNull()
    })
  })

  describe('extractProject', () => {
    it('removes created and updated fields from project object', () => {
      const project = {
        _id: 'proj123',
        title: 'My Video Project',
        src: 'https://example.com/video.mp4',
        notes: ['note1', 'note2'],
        user: 'user123',
        created: '2020-01-01T00:00:00.000Z',
        updated: '2020-06-15T12:00:00.000Z',
      }
      const result = extractProject(project)
      expect(result).toEqual({
        _id: 'proj123',
        title: 'My Video Project',
        src: 'https://example.com/video.mp4',
        notes: ['note1', 'note2'],
        user: 'user123',
      })
      expect(result).not.toHaveProperty('created')
      expect(result).not.toHaveProperty('updated')
    })

    it('preserves all other project fields', () => {
      const project = {
        _id: 'proj456',
        title: 'Another Project',
        src: 'https://example.com/another.mp4',
        notes: [],
        user: 'user456',
        sharedUsers: ['user789'],
        share: { url: 'abc123', canEdit: true },
        created: '2020-01-01T00:00:00.000Z',
        updated: '2020-06-15T12:00:00.000Z',
      }
      const result = extractProject(project)
      expect(result.sharedUsers).toEqual(['user789'])
      expect(result.share).toEqual({ url: 'abc123', canEdit: true })
    })

    it('returns null for null input', () => {
      const result = extractProject(null as any)
      expect(result).toBeNull()
    })

    it('returns null for undefined input', () => {
      const result = extractProject(undefined as any)
      expect(result).toBeNull()
    })
  })

  describe('extractPublicProject', () => {
    it('removes created, updated, and userIds fields from public project', () => {
      const project = {
        _id: 'proj123',
        title: 'Shared Project',
        src: 'https://example.com/shared.mp4',
        notes: ['note1'],
        created: '2020-01-01T00:00:00.000Z',
        updated: '2020-06-15T12:00:00.000Z',
        userIds: ['user1', 'user2', 'user3'],
      }
      const result = extractPublicProject(project)
      expect(result).toEqual({
        _id: 'proj123',
        title: 'Shared Project',
        src: 'https://example.com/shared.mp4',
        notes: ['note1'],
      })
      expect(result).not.toHaveProperty('created')
      expect(result).not.toHaveProperty('updated')
      expect(result).not.toHaveProperty('userIds')
    })

    it('preserves share settings for public access', () => {
      const project = {
        _id: 'proj789',
        title: 'Public Project',
        src: 'https://example.com/public.mp4',
        notes: [],
        share: { url: 'publicurl', canEdit: false, password: '' },
        created: '2020-01-01T00:00:00.000Z',
        updated: '2020-06-15T12:00:00.000Z',
        userIds: ['owner'],
      }
      const result = extractPublicProject(project)
      expect(result.share).toEqual({ url: 'publicurl', canEdit: false, password: '' })
    })

    it('returns null for null input', () => {
      const result = extractPublicProject(null as any)
      expect(result).toBeNull()
    })

    it('returns null for undefined input', () => {
      const result = extractPublicProject(undefined as any)
      expect(result).toBeNull()
    })
  })
})
