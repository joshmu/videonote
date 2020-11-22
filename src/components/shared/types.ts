/**
 * @path /src/components/shared/types.ts
 *
 * @project videonote
 * @file types.ts
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Wednesday, 18th November 2020
 * @modified Sunday, 22nd November 2020 5:59:52 pm
 * @copyright © 2020 - 2020 MU
 */

import { Document } from 'mongoose'

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
  _id?: string
  content: string
  time?: number
  done?: boolean
  user?: string | UserInterface
  project: string | ProjectInterface
  currentSession?: boolean
}

export interface SettingsInterface {
  _id?: string
  user?: string | UserInterface
  currentProject: string | ProjectInterface
  playOffset?: number
  showHints?: boolean
  seekJump?: number
  sidebarWidth?: number
}

export interface ShareProjectInterface {
  _id?: string
  url: string
  user?: string | UserInterface
  project?: string | ProjectInterface
  password?: string
  canEdit?: boolean
}

export interface ProgressInterface {
  playedSeconds: number
  played: number
  loadedSeconds: number
  loaded: number
}

export enum ProjectApiActions {
  GET = 'GET',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  REMOVE = 'REMOVE',
  SHARE = 'SHARE',
  REMOVE_SHARE = 'REMOVE SHARE',
}

export enum NoteApiAction {
  REMOVE_DONE_NOTES = 'REMOVE DONE NOTES',
  REMOVE = 'remove',
}

export interface ProjectDocInterface extends Document {
  share?: string | ShareProjectInterface
}

export interface ShareDocInterface extends Document {
  password: string
  project: string | ProjectInterface
}

export interface UserDocInterface extends Document {
  email: string
}
export interface NoteDocInterface extends Document {
  user: string | UserInterface
  project: string | ProjectInterface
}
