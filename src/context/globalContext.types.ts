/**
 * @path /src/context/globalContext.types.ts
 *
 * @project videonote
 * @file globalContext.types.ts
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Thursday, 19th November 2020
 * @modified Sunday, 22nd November 2020 7:18:30 pm
 * @copyright © 2020 - 2020 MU
 */

import { MutableRefObject } from 'react'

import { ModalType } from '@/components/Modals/Modals'
import {
  CancelPromptType,
  ConfirmPromptType,
  CreatePromptType,
  PromptInterface,
} from '@/hooks/usePrompt'
import {
  NoteInterface,
  ProjectApiActions,
  ProjectInterface,
  SettingsInterface,
  ShareProjectInterface,
  UserInterface,
} from '@/shared/types'

export interface GlobalContextInterface {
  user: UserInterface
  updateUser: UpdateUserType
  projects: ProjectInterface[]
  removeProject: RemoveProjectType
  project: ProjectInterface
  settings: SettingsInterface
  updateSettings: UpdateSettingsType
  menuOpen: boolean
  toggleMenuOpen: ToggleMenuOpenType
  modalsOpen: ModalType[]
  toggleModalOpen: ToggleModalOpenType
  createProject: CreateProjectType
  loadProject: LoadProjectType
  sidebarOpen: boolean
  toggleSidebar: ToggleSidebarType
  updateProject: UpdateProjectType
  handleInitialServerData: HandleInitialServerDataType
  SETTINGS_DEFAULTS: SettingsInterface
  HINTS: string[]
  admin: boolean
  copyToClipboard: CopyToClipboardType
  removeAccount: RemoveAccountType
  promptState: PromptInterface
  createPrompt: CreatePromptType
  confirmPrompt: ConfirmPromptType
  cancelPrompt: CancelPromptType
  cancelModals: CancelModalsType
  noteApi: NoteApiType
  noteApiRemoveDoneNotes: NoteApiRemoveDoneNotes
  updateProjectsStateWithUpdatedNotes: UpdateProjectsStateWithUpdatedNotesType
  shareProject: ShareProjectType
  removeShareProject: RemoveShareProjectType
  checkCanEdit: CheckCanEditType
  actionInputRef: MutableRefObject<HTMLInputElement | null>
  actionInputFocus: ActionInputFocusType
}

export type NoteApiType = (
  noteData:
    | NoteInterface
    | {
        [key: string]: any
      }
) => Promise<NoteInterface | 'error'>

export type NoteApiRemoveDoneNotes = () => Promise<NoteInterface[]>

export type UpdateProjectType = (
  projectData: ProjectInterface | { _id?: string; src: string }
) => Promise<void>

export type ShareProjectType = (
  shareData: ShareProjectInterface
) => Promise<boolean>

export type RemoveShareProjectType = () => Promise<boolean>

export type UpdateProjectsStateWithUpdatedNotesType = (
  notes: NoteInterface[]
) => Promise<void>

export type LoadProjectType = (projectId: string) => Promise<void>

export type GuestUpdatingProjectType = (
  project: ProjectInterface
) => Promise<void>

export type UpdateUserType = (
  userData: UserInterface | { username: string; email: string }
) => Promise<void>

export type UpdateSettingsType = (newSettingsData: {
  [key: string]: any
}) => Promise<void>

export type ToggleMenuOpenType = (state?: boolean) => void

export type ToggleSidebarType = (state?: boolean) => void

export type ToggleModalOpenType = (modalName?: ModalType) => void

export type CreateProjectType = (
  projectData: ProjectInterface | { title: string; src: string }
) => Promise<void>

export type RemoveProjectType = (_id: string) => Promise<void>

export type FetchWithPasswordPublicProjectType = (
  password: string
) => Promise<ProjectInterface>

export type HandleInitialServerDataType = (data: { [key: string]: any }) => void

export type AlertProjectLoadedType = (project: ProjectInterface) => void

export type ProjectApiType = (
  action: ProjectApiActions,
  project: ProjectInterface | { [key: string]: any }
) => Promise<any | void>

export type CopyToClipboardType = (txt: string, alertMsg?: string) => void

export type BadResponseType = (res: Response, msg: string) => boolean

export type RemoveAccountType = (userData: UserInterface) => Promise<void>

export type CancelModalsType = () => void

export type CheckCanEditType = () => boolean

export type ActionInputFocusType = () => void
