# CLAUDE.md - VideoNote AI Assistant Guide

This document provides comprehensive guidance for AI assistants working with the VideoNote codebase.

## Project Overview

VideoNote is a video review application that allows users to create timestamped notes while watching videos. It features intuitive controls for on-the-fly note creation, project sharing, and multiple themes.

**Repository**: A Next.js application with MongoDB backend and JWT authentication.

## Tech Stack

- **Framework**: Next.js 12 (Pages Router)
- **Language**: TypeScript + JavaScript hybrid
- **UI**: React 17, Tailwind CSS 3, Framer Motion
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens stored in cookies
- **Video Player**: react-player
- **Email**: Nodemailer for SMTP
- **Testing**: Jest + React Testing Library

## Directory Structure

```
videonote/
├── pages/                    # Next.js pages (routes)
│   ├── api/                  # API routes (serverless functions)
│   │   ├── auth.js           # JWT authentication
│   │   ├── login.js          # User login
│   │   ├── register.js       # User registration
│   │   ├── project.ts        # Project CRUD operations
│   │   ├── note.ts           # Note CRUD operations
│   │   ├── settings.js       # User settings
│   │   ├── user.js           # User management
│   │   ├── public_project.ts # Public project access
│   │   └── public_project_update.ts
│   ├── _app.tsx              # App wrapper with providers
│   ├── _document.tsx         # Custom document
│   ├── index.tsx             # Main app (authenticated)
│   ├── login.tsx             # Login page
│   ├── hello.tsx             # Landing page
│   ├── vn/[id].tsx           # Shared project view
│   ├── privacy.tsx           # Privacy policy
│   └── terms.tsx             # Terms of service
├── src/
│   ├── components/           # React components
│   │   ├── ActionInput/      # Note input component
│   │   ├── HelloPage/        # Landing page components
│   │   ├── Layout/           # App layout (Header, Footer, etc.)
│   │   ├── LoginPage/        # Login/Register modals
│   │   ├── Modals/           # All modal components
│   │   ├── NoteList/         # Note listing components
│   │   ├── Notification/     # Toast notifications
│   │   ├── Sidebar/          # Sidebar with notes
│   │   ├── VideoPlayer/      # Video player wrapper
│   │   ├── shared/           # Reusable components
│   │   └── _unused_/         # Deprecated components
│   ├── context/              # React Context providers
│   │   ├── globalContext.tsx # Main app state
│   │   ├── noteContext.tsx   # Notes state
│   │   ├── videoContext.tsx  # Video player state
│   │   ├── controlsContext.tsx # Keyboard controls
│   │   ├── notificationContext.tsx # Toast state
│   │   └── themeContext.tsx  # Theme management
│   ├── hooks/                # Custom React hooks
│   │   ├── useGlobalKeydown.tsx
│   │   ├── useResizable.tsx
│   │   ├── useNoteProximity.tsx
│   │   └── ...
│   ├── styles/
│   │   └── globals.scss      # Global styles & themes
│   └── __test__/             # Test setup
├── utils/                    # Utility functions
│   ├── mongoose.ts           # MongoDB models & connection
│   ├── jwt.ts                # JWT helpers
│   ├── clientHelpers.ts      # Client-side utilities
│   └── apiHelpers.ts         # API utilities
├── plop-templates/           # Code generators
├── public/                   # Static assets
└── Configuration files
```

## Path Aliases

The project uses path aliases defined in `jsconfig.json` and `jest.config.json`:

| Alias | Path |
|-------|------|
| `@/root/*` | `./*` |
| `@/layout/*` | `src/components/Layout/*` |
| `@/components/*` | `src/components/*` |
| `@/shared/*` | `src/components/shared/*` |
| `@/context/*` | `src/context/*` |
| `@/hooks/*` | `src/hooks/*` |
| `@/styles/*` | `src/styles/*` |
| `@/pages/*` | `pages/*` |
| `@/api/*` | `pages/api/*` |
| `@/utils/*` | `utils/*` |

## State Management

The app uses React Context for state management with the following hierarchy:

```
NotificationProvider (toast alerts)
└── ThemeProvider (theme state)
    └── GlobalProvider (user, projects, settings)
        └── VideoProvider (video playback)
            └── NoteProvider (notes)
                └── ControlsProvider (keyboard shortcuts)
```

### Key Contexts

- **GlobalContext** (`src/context/globalContext.tsx`): User auth, projects, settings, modals
- **NoteContext** (`src/context/noteContext.tsx`): Note CRUD, search, sorting
- **VideoContext** (`src/context/videoContext.tsx`): Video playback, seeking, volume
- **ThemeContext** (`src/context/themeContext.tsx`): Theme toggling (light/dark/superhero/hot)

## Database Models

Defined in `utils/mongoose.ts`:

### User
```typescript
{
  email: string (unique, required)
  username: string
  projects: ObjectId[] (ref: Project)
  settings: ObjectId (ref: Settings)
  role: 'free' | 'paid'
  password: string
}
```

### Project
```typescript
{
  title: string (required)
  src: string (video URL)
  notes: ObjectId[] (ref: Note)
  user: ObjectId (ref: User, required)
  sharedUsers: ObjectId[] (ref: User)
  share: ObjectId (ref: Share)
}
```

### Note
```typescript
{
  content: string (required)
  time: number (default: 0)
  done: boolean (default: false)
  user: ObjectId (ref: User)
  project: ObjectId (ref: Project)
}
```

### Settings
```typescript
{
  user: ObjectId (ref: User, required, unique)
  currentProject: ObjectId (ref: Project)
  playOffset: number
  showHints: boolean (default: true)
  seekJump: number
  sidebarWidth: number
}
```

### Share (for sharing projects)
```typescript
{
  url: string (unique, required)
  user: ObjectId (ref: User, required)
  project: ObjectId (ref: Project)
  password: string (hashed, default: '')
  canEdit: boolean (default: true)
}
```

## API Routes

All API routes use POST method and JWT token authentication (via `Authorization: Bearer <token>` header).

### Authentication
- `POST /api/auth` - Validate token and get user data
- `POST /api/login` - Login with email/password
- `POST /api/register` - Create new account

### Projects
- `POST /api/project` with `action`:
  - `GET` - Get single project with populated notes
  - `CREATE` - Create new project
  - `UPDATE` - Update project details
  - `REMOVE` - Delete project and all notes
  - `SHARE` - Create/update share settings
  - `REMOVE SHARE` - Remove sharing

### Notes
- `POST /api/note` - Create/update/delete notes
  - Supports `REMOVE_DONE_NOTES` action

### Settings
- `POST /api/settings` - Update user settings

### Public Projects
- `POST /api/public_project` - Access shared project (optionally with password)
- `POST /api/public_project_update` - Guest updates to shared project

## Component Conventions

### File Structure
Components are organized in folders with the component name:
```
ComponentName/
├── ComponentName.tsx
└── ComponentName.test.tsx (optional)
```

### Creating Components
Use plop for scaffolding:
```bash
npm run plop component   # Create component
npm run plop page        # Create page
```

### Component Pattern
```tsx
export const ComponentName = (props: { [key: string]: any }) => {
  // Context hooks at top
  const { setting } = useGlobalContext()

  // State and refs
  const [state, setState] = useState()

  // Effects
  useEffect(() => {}, [])

  return (
    <div>Content</div>
  )
}
```

## Styling

### Tailwind CSS
- Config: `tailwind.config.js`
- Custom colors use CSS variables for theming
- Theme-aware classes: `text-themeText`, `bg-themeBg`, `text-themeAccent`

### Themes
Defined in `src/styles/globals.scss`:
- `theme-light` - Light mode
- `theme-dark` - Dark mode
- `theme-superhero` - Purple/yellow theme
- `theme-hot` - Blue/red theme

### CSS Variables
```css
--text, --text2       /* Text colors */
--bg, --bg2           /* Background colors */
--accent, --accent2   /* Accent colors */
--select              /* Selection color */
```

### Neumorphism
Custom `.neu-*` classes for neumorphic styling.

## Development Workflow

### Setup
```bash
npm install
cp .env.example .env.local  # Configure environment
npm run dev                  # Start development server
```

### Commands
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run test         # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
npm run plop         # Code generator
```

### Environment Variables
Required in `.env.local`:
```
MONGODB_URI=mongodb+srv://...
MONGODB_DB=<database_name>
SMTP_USER=<email>
SMTP_PASS=<password>
JWT_TOKEN_SECRET=<secret>
```

## Key Features & Implementation Notes

### Video Player
- Uses `react-player` for cross-platform video support
- Supports URL-based videos and local file uploads
- Playback offset setting for note timing adjustments

### Note System
- Notes are timestamped to video position
- Optimistic updates with rollback on error
- Notes can be marked as "done" (completed)
- Search and chronological sorting

### Keyboard Shortcuts
- `Space` - Play/Pause
- `Left/Right` - Seek backward/forward
- `Up/Down` - Volume control
- `Shift + Space` - Toggle sidebar
- `Shift + Left/Right` - Previous/Next note

### Project Sharing
- Generate shareable URLs
- Optional password protection
- Can control if guests can edit notes

### Guest Mode
When accessing shared projects without authentication, `admin` flag is `false` in GlobalContext.

## Testing

- Framework: Jest with React Testing Library
- Setup: `src/__test__/setupTests.tsx`
- CSS mocking via `identity-obj-proxy`
- Run: `npm test`

## Common Tasks

### Add a new API endpoint
1. Create file in `pages/api/`
2. Use JWT authentication pattern from existing endpoints
3. Import models from `@/utils/mongoose`

### Add a new component
```bash
npm run plop component
```

### Add a new page
```bash
npm run plop page
```

### Add a new context
1. Create in `src/context/`
2. Export `Provider` component and `useXxxContext` hook
3. Add to provider hierarchy in `pages/_app.tsx` or `pages/index.tsx`

### Modify database schema
1. Update schema in `utils/mongoose.ts`
2. Update corresponding interface in `src/components/shared/types.ts`

## Code Style

### File Headers
Files include standardized headers with path, project, author, dates:
```typescript
/**
 * @path /path/to/file
 * @project videonote
 * @file filename.ts
 * @author Josh Mu <hello@joshmu.dev>
 * @created Date
 * @modified Date
 * @copyright © 2020 - 2020 MU
 */
```

### TypeScript
- Interfaces defined in `src/components/shared/types.ts`
- Type annotations for context values and function signatures
- Some files remain `.js` (legacy)

### API Response Pattern
```typescript
return res.status(StatusCodes.OK).json({
  data: result,
  token: newToken,  // Refresh JWT
  msg: 'Success message'
})
```

## Known Patterns

### Fetcher utility
Client-side API calls use `fetcher` from `@/utils/clientHelpers`:
```typescript
const { res, data } = await fetcher('/api/endpoint', body)
```

### Modal System
Modals are managed through `modalsOpen` array in GlobalContext:
```typescript
toggleModalOpen(ModalType.SETTINGS)  // Open
toggleModalOpen()                     // Close all
```

### Toast Notifications
```typescript
const { addAlert } = useNotificationContext()
addAlert({ type: 'success' | 'error' | 'info' | 'warning', msg: 'Message' })
```
