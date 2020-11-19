import {
  NoteInterface,
  ProjectApiActionsEnum,
  ProjectInterface,
  SettingsInterface,
  ShareProjectInterface,
  UserInterface,
} from '@/shared/interfaces'

import {
  CancelPromptType,
  ConfirmPromptType,
  CreatePromptType,
  PromptInterface,
} from './../hooks/usePrompt'

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
  modalsOpen: string[]
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
  actionInputRef: HTMLInputElement
  actionInputFocus: ActionInputFocusType
}

export type NoteApiType = (noteData: {
  [key: string]: any
}) => Promise<NoteInterface>

export type NoteApiRemoveDoneNotes = () => Promise<NoteInterface[]>

export type UpdateProjectType = (projectData: {
  [key: string]: any
}) => Promise<void>

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

export type UpdateUserType = (userData: UserInterface) => Promise<void>

export type UpdateSettingsType = (newSettingsData: {
  [key: string]: any
}) => Promise<void>

export type ToggleMenuOpenType = (state?: boolean) => void

export type ToggleSidebarType = (state?: boolean) => void

export type ToggleModalOpenType = (modalName?: string) => void

export type CreateProjectType = (projectData: ProjectInterface) => Promise<void>

export type RemoveProjectType = (_id: string) => Promise<void>

export type FetchWithPasswordPublicProjectType = (
  password: string
) => Promise<ProjectInterface>

export type HandleInitialServerDataType = (data: { [key: string]: any }) => void

export type AlertProjectLoadedType = (project: ProjectInterface) => void

export type ProjectApiType = (
  action: ProjectApiActionsEnum,
  project: ProjectInterface
) => Promise<any | void>

export type CopyToClipboardType = (txt: string, alertMsg?: string) => void

export type BadResponseType = (res: Response, msg: string) => boolean

export type RemoveAccountType = (userData: UserInterface) => Promise<void>

export type CancelModalsType = () => void

export type HandleGlobalEscapeKeyType = (key: string) => void

export type CheckCanEditType = () => boolean

export type ActionInputFocusType = () => void
