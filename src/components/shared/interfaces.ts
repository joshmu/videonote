export interface UserInterface {
  _id: string
  email: string
  username: string
  projects: string[] | ProjectInterface[]
  settings?: string | SettingsInterface
  role?: 'free' | 'paid'
  password: string
}

export interface ProjectInterface {
  _id: string
  title: string
  src?: string
  notes: string[] | NoteInterface[]
  user: string | UserInterface
  sharedUsers?: string[] | UserInterface[]
  share?: string | ShareProjectInterface
}

export interface NoteInterface {
  _id: string
  content: string
  time?: number
  done?: boolean
  user?: string | UserInterface
  project: string | ProjectInterface
  currentSession?: boolean
}

export interface SettingsInterface {
  _id: string
  user: string | UserInterface
  currentProject: string | ProjectInterface
  playOffset?: number
  showHints?: boolean
  seekJump?: number
  sidebarWidth?: number
}

export interface ShareProjectInterface {
  _id: string
  url: string
  user: string | UserInterface
  projectd: string | ProjectInterface
  password?: string
  canEdit?: boolean
}
