import { createContext, useContext, useEffect, useState } from "react";

import { ModalType } from "@/components/Modals/Modals";
import {
  type NoteInterface,
  ProjectApiActions,
  type ProjectInterface,
  type ShareProjectInterface,
} from "@/shared/types";
import type { ProjectReply } from "@/utils/apiClient";

import { useNotificationContext } from "./notificationContext";
import { type SessionAccount, useSessionContext } from "./sessionContext";
import { useUiShellContext } from "./uiShellContext";

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
type AlertProjectLoadedType = (project: ProjectInterface) => void;
type WarnLocalVideoType = (project: ProjectInterface) => void;
type ProjectApiType = (
  action: ProjectApiActions,
  project: Partial<ProjectInterface>,
  share?: Partial<ShareProjectInterface>,
) => Promise<ProjectReply | void>;

interface ProjectsContextInterface {
  projects: ProjectInterface[];
  project: ProjectInterface;
  projectsExist: boolean;
  openProjects: (account: SessionAccount) => void;
  showSharedProject: (project: ProjectInterface) => void;
  createProject: CreateProjectType;
  loadProject: LoadProjectType;
  updateProject: UpdateProjectType;
  removeProject: RemoveProjectType;
  shareProject: ShareProjectType;
  removeShareProject: RemoveShareProjectType;
  updateProjectsStateWithUpdatedNotes: UpdateProjectsStateWithUpdatedNotesType;
  warnLocalVideo: WarnLocalVideoType;
}

const projectsContext = createContext<ProjectsContextInterface>(null!);

/** The Projects on screen and the current one, with the owner's project and Share changes. */
export const ProjectsProvider = ({ children }: { children: React.ReactNode }) => {
  const [projects, setProjects] = useState<ProjectInterface[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectInterface>(null!);

  const { addAlert } = useNotificationContext();
  const { api, user, isAdmin, settings, updateSettings, reportFailure } = useSessionContext();
  const { modalsOpen, toggleModalOpen } = useUiShellContext();

  // notification recommend creating a project if there are no projects and we have loaded the user
  useEffect(() => {
    if (projects.length === 0 && user) {
      // wipe any existing state if there were previously projects
      setCurrentProject(null);
      // presume user could be new (this could also occur if previous projects have been removed)

      // if we have a previously open modal, close it
      if (modalsOpen.length > 0) toggleModalOpen();

      // welcome modal
      toggleModalOpen(ModalType.WELCOME);

      addAlert({
        type: "info",
        msg: "Create a project to start",
      });
    }
  }, [projects, user]);

  // reset settings.currentProject when projects are empty
  useEffect(() => {
    if (projects.length === 0 && settings.currentProject)
      updateSettings({ currentProject: null, _id: settings._id });
  }, [projects, settings]);

  // the signed-in account's projects: load the stored current one, else the last
  const openProjects = ({ projects, settings }: SessionAccount): void => {
    setProjects(projects);

    if (projects.length > 0) {
      let currentProject: ProjectInterface;

      // if settings data is passed back and we have a currentProject Id
      // stored then lets find the project and assign
      if (settings && settings.currentProject) {
        currentProject = (projects as ProjectInterface[]).find(
          (project) => project._id === settings.currentProject,
        );
      }
      // if we still don't have anything then just grab last project entry in the list
      if (!currentProject) {
        currentProject = projects.slice(-1)[0];
      }

      loadProject(currentProject._id);
    }
  };

  const showSharedProject = (project: ProjectInterface): void => {
    setProjects([project]);
    setCurrentProject(project);
    alertProjectLoaded(project);
  };

  const updateProject: UpdateProjectType = async (projectData) => {
    if (!isAdmin()) return;

    // add _id for db processing
    projectData._id = currentProject._id;

    const response = await projectApi(ProjectApiActions.UPDATE, projectData);
    if (!response) return console.error("api error");

    // Take only the edited fields: the reply carries notes and Share as ids.
    const { _id, title, src } = response.project;
    setProjects((current) => current.map((p) => (p._id === _id ? { ...p, title, src } : p)));
    setCurrentProject((current) => ({ ...current, title, src }));
  };

  const shareProject: ShareProjectType = async (shareData) => {
    const response = await projectApi(
      ProjectApiActions.SHARE,
      { _id: currentProject._id },
      shareData,
    );
    if (!response) return false;

    const { project } = response;
    const share = project.share as ShareProjectInterface;

    // update the relevant project 'share' prop
    setProjects((current) =>
      current.map((p) => {
        return p._id === project._id ? { ...p, share: project.share } : p;
      }),
    );
    // also update current project state with new 'share' data
    setCurrentProject((current) => ({ ...current, share: project.share }));

    // return true/false based on returned data matching data sent to server
    const valuesToCheck = ["canEdit", "url"];
    return valuesToCheck.every((key) => share[key] === shareData[key]);
  };

  const removeShareProject: RemoveShareProjectType = async () => {
    const response = await projectApi(
      ProjectApiActions.REMOVE_SHARE,
      { _id: currentProject._id },
      { _id: (currentProject.share as ShareProjectInterface)._id },
    );
    if (!response) return false;

    const { project } = response;

    // update the relevant project
    setProjects((current) =>
      current.map((p) => {
        return p._id === project._id ? project : p;
      }),
    );
    // also update current project state
    setCurrentProject(project);

    return true;
  };

  // keep the projects list (note counts) and the current project (export, note-count guard,
  // updateProject) in step with the note list
  const updateProjectsStateWithUpdatedNotes: UpdateProjectsStateWithUpdatedNotesType = async (
    notes,
  ) => {
    const projectId = currentProject._id;
    setProjects((current) => current.map((p) => (p._id === projectId ? { ...p, notes } : p)));
    setCurrentProject((current) => (current?._id === projectId ? { ...current, notes } : current));
  };

  const loadProject: LoadProjectType = async (projectId) => {
    const projectData = { _id: projectId };
    const response = await projectApi(ProjectApiActions.GET, projectData);
    if (!response) return console.error("api error");

    const { project } = response;

    // update the relevant project
    setProjects((current) =>
      current.map((p) => {
        return p._id === project._id ? project : p;
      }),
    );

    // also update current project state
    setCurrentProject(project);

    // update current project settings if it has changed
    console.log("updateProject", project._id, settings.currentProject);
    if (project._id !== settings.currentProject) {
      console.log("updating settings");
      updateSettings({ currentProject: project._id, _id: settings._id });
    }

    alertProjectLoaded(project);
    if (project.src.length === 0) warnLocalVideo(project);
  };

  const createProject: CreateProjectType = async (projectData) => {
    const response = await projectApi(ProjectApiActions.CREATE, projectData);
    if (!response) return console.error("api error");

    // expect project as response from server
    const { project } = response;

    // add project
    setProjects((current) => [...current, project]);

    // set current project
    setCurrentProject(project);

    // update settings
    updateSettings({ currentProject: project._id });

    alertProjectLoaded(project);
  };

  const removeProject: RemoveProjectType = async (_id) => {
    const projectData = { _id };
    const response = await projectApi(ProjectApiActions.REMOVE, projectData);
    if (!response) return console.error("api error");

    const { project } = response;

    // if 'project' received then 'delete' is successful
    if (project) {
      const remainingProjects = projects.filter((p) => p._id !== project._id);
      // remove project from state
      setProjects(remainingProjects);

      // load another project if we are removing current project
      if (remainingProjects.length > 0 && settings.currentProject === _id) {
        const newCurrentProject = remainingProjects.slice(-1)[0];
        loadProject(newCurrentProject._id);
      }
    }
  };

  const alertProjectLoaded: AlertProjectLoadedType = (project) => {
    // notification when we load a project
    addAlert({
      type: "project",
      msg: `${project.title.toUpperCase()}`,
    });
  };

  const projectApi: ProjectApiType = async (action, project, share) => {
    const result = await api.project(action, project, share);
    if (result.kind !== "ok") return reportFailure(result);
    return result.data;
  };

  const warnLocalVideo: WarnLocalVideoType = (project) => {
    addAlert({
      type: "warning",
      msg: (
        <span>
          Please provide video source for project:{" "}
          {project?.title && <span className="text-themeAccent">{project.title}</span>}
        </span>
      ),
      duration: 12000,
    });
    toggleModalOpen(ModalType.CURRENT_PROJECT);
  };

  const projectsExist: boolean = projects.length > 0;

  const value: ProjectsContextInterface = {
    projects,
    project: currentProject,
    projectsExist,
    openProjects,
    showSharedProject,
    createProject,
    loadProject,
    updateProject,
    removeProject,
    shareProject,
    removeShareProject,
    updateProjectsStateWithUpdatedNotes,
    warnLocalVideo,
  };

  return <projectsContext.Provider value={value}>{children}</projectsContext.Provider>;
};

export const useProjectsContext = (): ProjectsContextInterface => useContext(projectsContext);
