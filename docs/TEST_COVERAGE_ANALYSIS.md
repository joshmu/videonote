# Test Coverage Analysis - VideoNote

## Executive Summary

**Current State: No tests exist in the codebase.**

Despite having testing infrastructure configured (Jest, React Testing Library, jest-axe), there are **zero test files** in the project. The test setup file at `src/__test__/setupTests.tsx` includes mocks for framer-motion, contexts, and IntersectionObserver, but no actual tests use it.

Running `npm test` returns:
```
No tests found, exiting with code 1
```

---

## Codebase Inventory

| Category | File Count | Current Coverage |
|----------|------------|------------------|
| Contexts | 6 | 0% |
| Hooks | 9 | 0% |
| Utilities | 4 | 0% |
| API Routes | 10 | 0% |
| Components | 70+ | 0% |
| **Total** | **100+** | **0%** |

---

## Priority Recommendations

### Tier 1: Critical (Immediate Priority)

These areas handle authentication, data integrity, and core business logic. Bugs here have the highest impact.

#### 1. Utility Functions (`utils/`)

**Why:** Pure functions with no dependencies - easiest to test and highest ROI.

| File | Functions to Test | Test Cases |
|------|-------------------|------------|
| `clientHelpers.ts` | `checkEmail`, `checkUsername`, `checkPassword`, `checkPasswordMatch`, `isValidCredentials`, `formatDuration` | Valid/invalid emails, edge cases (empty strings, special chars), password matching |
| `apiHelpers.ts` | `extractUser`, `extractProject`, `extractPublicProject` | Data sanitization, field removal, null handling |
| `jwt.ts` | `authenticateToken`, `generateAccessToken` | Valid tokens, expired tokens, malformed tokens, error cases |

**Example test for `clientHelpers.ts`:**
```typescript
describe('checkEmail', () => {
  it('returns true for valid email', () => {
    expect(checkEmail('user@example.com')).toBe(true)
  })
  it('returns false for invalid email', () => {
    expect(checkEmail('invalid')).toBe(false)
    expect(checkEmail('')).toBe(false)
  })
})

describe('formatDuration', () => {
  it('formats seconds correctly', () => {
    expect(formatDuration(65)).toBe('1:05')
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(3661)).toBe('61:01')
  })
})
```

#### 2. API Routes (`pages/api/`)

**Why:** Backend logic handling authentication, data persistence, and sharing. Errors here can corrupt data or expose security vulnerabilities.

| Route | Priority | Key Test Cases |
|-------|----------|----------------|
| `auth.js` | Critical | Token validation, expired token handling, user population |
| `login.js` | Critical | Valid credentials, invalid password, non-existent user, token generation |
| `register.js` | Critical | Valid registration, duplicate email, invalid email, password requirements |
| `project.ts` | High | CRUD operations, authorization, share creation/removal |
| `note.ts` | High | CRUD operations, guest permissions, `REMOVE_DONE_NOTES` |
| `settings.js` | Medium | Settings update, field validation |
| `user.js` | High | Password verification before account deletion |
| `public_project.ts` | High | Password-protected access, invalid share URLs |

**Recommended approach:** Use supertest or next-test-api-route-handler for API route testing.

#### 3. Context Providers (`src/context/`)

**Why:** Contexts manage all application state. Bugs here affect the entire app.

| Context | Priority | Key Test Cases |
|---------|----------|----------------|
| `globalContext.tsx` | Critical | User state, project CRUD, modal management, API error handling |
| `noteContext.tsx` | Critical | Note CRUD, search filtering, sort logic, optimistic updates |
| `videoContext.tsx` | High | Play/pause, seek, volume, playback rate |
| `controlsContext.tsx` | Medium | Keyboard binding, action dispatching |
| `notificationContext.tsx` | Medium | Alert addition, deduplication, auto-dismissal |
| `themeContext.tsx` | Low | Theme switching, localStorage persistence |

---

### Tier 2: Important (High Value)

#### 4. Custom Hooks (`src/hooks/`)

| Hook | Priority | Test Cases |
|------|----------|------------|
| `useNoteProximity.tsx` | High | Finds closest note to current time, edge cases (no notes, exact match) |
| `useGlobalKeydown.tsx` | High | Key event handling, modifier key combinations |
| `usePrompt.tsx` | Medium | State transitions, password requirement handling |
| `useResizable.tsx` | Medium | Resize calculations, boundary constraints |
| `useIsMount.tsx` | Low | Mount state tracking |

#### 5. Core Components

| Component | Priority | Test Cases |
|-----------|----------|------------|
| `ActionInput.tsx` | High | Note submission, timestamp capture, input validation |
| `NoteList.tsx` | High | Rendering notes, filtering, sorting |
| `NoteItem.tsx` | High | Edit mode, delete, done toggle, time click navigation |
| `VideoPlayer.tsx` | High | Player callbacks, error handling |
| `LoginModal.tsx` | Medium | Form validation, submission, error display |
| `RegisterModal.tsx` | Medium | Form validation, password matching |
| `Sidebar.tsx` | Medium | Resize behavior, collapse/expand |

---

### Tier 3: Nice-to-Have (Lower Priority)

- **Shared UI Components:** Modal primitives, Text, Toggle, Loader, Select
- **UX/Animation Components:** MotionFadeUp, Reveal, Parallax
- **Landing Page Components:** Hero, Features, CTA, Overview

---

## Recommended Testing Stack

The current `package.json` already includes:
- `jest` (via Next.js)
- `@testing-library/react` - Component testing
- `@testing-library/jest-dom` - Custom matchers
- `@testing-library/user-event` - User interaction simulation
- `jest-axe` - Accessibility testing

**Additional recommendations:**

```bash
# For API route testing
npm install -D supertest @types/supertest

# For mocking fetch in tests
npm install -D msw  # Mock Service Worker

# For database testing (optional)
npm install -D mongodb-memory-server
```

---

## Implementation Roadmap

### Phase 0: CI/CD Setup (Day 1) ✅

**Set up continuous integration to run tests automatically on every PR.**

A GitHub Actions workflow has been added at `.github/workflows/test.yml` that:
- Runs on push/PR to main/master branches
- Tests against Node.js 18.x and 20.x
- Installs dependencies with `npm ci`
- Runs `npm test` with coverage
- Uploads coverage reports to Codecov (optional)

```yaml
# .github/workflows/test.yml
name: Test
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --passWithNoTests --coverage
```

**Why this is first:** Having CI in place ensures all future tests are validated automatically, catches regressions immediately, and establishes testing as a core part of the development workflow.

---

### Phase 1: Foundation
1. Add tests for `utils/clientHelpers.ts` - pure functions, quick wins
2. Add tests for `utils/apiHelpers.ts` - data extraction
3. Add tests for `utils/jwt.ts` - authentication core

### Phase 2: API Layer (Week 3-4)
1. Set up API route testing infrastructure
2. Add tests for `auth.js`, `login.js`, `register.js`
3. Add tests for `project.ts`, `note.ts`

### Phase 3: State Management (Week 5-6)
1. Add tests for `noteContext.tsx`
2. Add tests for `globalContext.tsx`
3. Add tests for `videoContext.tsx`

### Phase 4: Components (Week 7-8)
1. Add tests for `ActionInput`, `NoteList`, `NoteItem`
2. Add tests for login/register modals
3. Add integration tests for key user flows

---

## Quick Wins (Start Today)

These tests can be written immediately with minimal setup:

### 1. `utils/clientHelpers.test.ts`
```typescript
import {
  checkEmail,
  checkUsername,
  checkPassword,
  checkPasswordMatch,
  formatDuration,
} from './clientHelpers'

describe('clientHelpers', () => {
  describe('checkEmail', () => {
    it('validates correct emails', () => {
      expect(checkEmail('test@example.com')).toBe(true)
      expect(checkEmail('user.name@domain.co.uk')).toBe(true)
    })
    it('rejects invalid emails', () => {
      expect(checkEmail('invalid')).toBe(false)
      expect(checkEmail('@nodomain.com')).toBe(false)
      expect(checkEmail('')).toBe(false)
    })
  })

  describe('checkUsername', () => {
    it('requires minimum length', () => {
      expect(checkUsername('abcdef')).toBe(true)  // 6 chars
      expect(checkUsername('abcde')).toBe(false)  // 5 chars
      expect(checkUsername('')).toBe(false)
    })
  })

  describe('checkPassword', () => {
    it('requires minimum length', () => {
      expect(checkPassword('123456')).toBe(true)  // 6 chars
      expect(checkPassword('12345')).toBe(false)  // 5 chars
    })
  })

  describe('checkPasswordMatch', () => {
    it('returns true when passwords match', () => {
      expect(checkPasswordMatch('password', 'password')).toBe(true)
    })
    it('returns false when passwords differ', () => {
      expect(checkPasswordMatch('password', 'different')).toBe(false)
    })
  })

  describe('formatDuration', () => {
    it('formats time correctly', () => {
      expect(formatDuration(0)).toBe('0:00')
      expect(formatDuration(59)).toBe('0:59')
      expect(formatDuration(60)).toBe('1:00')
      expect(formatDuration(65)).toBe('1:05')
      expect(formatDuration(3661)).toBe('61:01')
    })
  })
})
```

### 2. Bug Found During Analysis

In `clientHelpers.ts`, there's an inconsistency:
- `checkUsername` message says "at least 3 characters"
- Actual check is `txt.length > 5` (requires 6+ characters)

This would be caught immediately with tests!

---

## Coverage Goals

| Phase | Target Coverage |
|-------|-----------------|
| Phase 1 (Utils) | 80%+ for utils/ |
| Phase 2 (API) | 70%+ for pages/api/ |
| Phase 3 (Context) | 60%+ for src/context/ |
| Phase 4 (Components) | 50%+ overall |

---

## Conclusion

The VideoNote codebase has **zero test coverage** despite having testing infrastructure in place. The highest-priority areas for testing are:

1. **Utility functions** - Pure, easy to test, high ROI
2. **API routes** - Critical for security and data integrity
3. **Context providers** - Core application state
4. **Key components** - ActionInput, NoteList, login/register

Starting with utility function tests provides immediate value and establishes testing patterns for the rest of the codebase.
