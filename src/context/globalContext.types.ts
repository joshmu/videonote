/**
 * @path /src/context/globalContext.types.ts
 *
 * @project videonote
 * @file globalContext.types.ts
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Thursday, 19th November 2020
 * @modified Tuesday, 1st December 2020 12:27:44 pm
 * @copyright © 2020 - 2020 MU
 */

import {
  NoteInterface,
  ProjectApiActions,
  ProjectInterface,
  ShareProjectInterface,
} from "@/shared/types";
import type { ProjectReply, ShareAccess } from "@/utils/apiClient";

export interface GlobalContextInterface {
  projects: ProjectInterface[];
  removeProject: RemoveProjectType;
  project: ProjectInterface;
  createProject: CreateProjectType;
  loadProject: LoadProjectType;
  updateProject: UpdateProjectType;
  handleInitialServerData: HandleInitialServerDataType;
  updateProjectsStateWithUpdatedNotes: UpdateProjectsStateWithUpdatedNotesType;
  shareProject: ShareProjectType;
  removeShareProject: RemoveShareProjectType;
  checkCanEdit: CheckCanEditType;
  warnLocalVideo: WarnLocalVideoType;
  projectsExist: boolean;
}

export type UpdateProjectType = (
  projectData: ProjectInterface | { _id?: string; src: string },
) => Promise<void>;

export type ShareProjectType = (shareData: ShareProjectInterface) => Promise<boolean>;

export type RemoveShareProjectType = () => Promise<boolean>;

export type UpdateProjectsStateWithUpdatedNotesType = (notes: NoteInterface[]) => Promise<void>;

export type LoadProjectType = (projectId: string) => Promise<void>;

export type CreateProjectType = (
  projectData: ProjectInterface | { title: string; src: string },
) => Promise<void>;

export type RemoveProjectType = (_id: string) => Promise<void>;

export type FetchWithPasswordPublicProjectType = (password: string) => Promise<ShareAccess>;

export type HandleInitialServerDataType = (data: { [key: string]: any }) => void;

export type AlertProjectLoadedType = (project: ProjectInterface) => void;

export type ProjectApiType = (
  action: ProjectApiActions,
  project: Partial<ProjectInterface>,
  share?: Partial<ShareProjectInterface>,
) => Promise<ProjectReply | void>;

export type CheckCanEditType = () => boolean;

export type WarnLocalVideoType = (project: ProjectInterface) => void;
