/**
 * @path /src/context/globalContext.tsx
 *
 * @project videonote
 * @file globalContext.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Tuesday, 1st December 2020 12:27:56 pm
 * @copyright © 2020 - 2020 MU
 */

import Router from "next/router";
import { createContext, useContext, useEffect, useState } from "react";

import {
  ProjectApiActions,
  ProjectInterface,
  ShareProjectInterface,
} from "@/root/src/components/shared/types";
import type { ShareAccess } from "@/utils/apiClient";

import { ModalType } from "../components/Modals/Modals";
import {
  AlertProjectLoadedType,
  CheckCanEditType,
  CreateProjectType,
  FetchWithPasswordPublicProjectType,
  GlobalContextInterface,
  HandleInitialServerDataType,
  LoadProjectType,
  NoteApiRemoveDoneNotes,
  NoteApiType,
  ProjectApiType,
  RemoveProjectType,
  RemoveShareProjectType,
  ShareProjectType,
  UpdateProjectType,
  UpdateProjectsStateWithUpdatedNotesType,
  WarnLocalVideoType,
} from "./globalContext.types";
import { useNotificationContext } from "./notificationContext";
import { useSessionContext } from "./sessionContext";
import { useUiShellContext } from "./uiShellContext";

const globalContext = createContext<GlobalContextInterface>(null!);

export const GlobalProvider = ({
  children,
  serverData,
  ...props
}: {
  children: React.ReactElement;
  serverData: {};
  props?: {};
}) => {
  const [projects, setProjects] = useState<ProjectInterface[]>([]);

  const [currentProject, setCurrentProject] = useState<ProjectInterface>(null!);

  const { addAlert } = useNotificationContext();
  const { api, user, admin, settings, startSession, updateSettings, reportFailure } =
    useSessionContext();
  const { modalsOpen, toggleModalOpen, createPrompt, cancelPrompt } = useUiShellContext();

  // initial load
  useEffect(() => {
    // initial response from server
    handleInitialServerData(serverData);
  }, []);

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

  const noteApi: NoteApiType = async (noteData) => {
    const result = await api.saveNote(noteData);
    if (result.kind !== "ok") {
      reportFailure(result);
      return "error";
    }
    return result.data.note;
  };

  const noteApiRemoveDoneNotes: NoteApiRemoveDoneNotes = async () => {
    const result = await api.removeDoneNotes(currentProject._id);
    if (result.kind !== "ok") {
      reportFailure(result);
      return "error";
    }
    return result.data.notes;
  };

  const updateProject: UpdateProjectType = async (projectData) => {
    if (!admin) return;

    // add _id for db processing
    projectData._id = currentProject._id;

    const response = await projectApi(ProjectApiActions.UPDATE, projectData);
    if (!response) return console.error("api error");

    const { project } = response;

    // update the relevant project
    // ! avoid updating the 'notes' as this was previously populated by mongoose converting the _id references to data
    setProjects((current) =>
      current.map((p) => {
        return p._id === project._id ? { ...project, notes: p.notes } : p;
      }),
    );
    // also update current project state
    // ! avoid updating the 'notes' as this was previously populated by mongoose converting the _id references to data
    setCurrentProject((current) => ({ ...project, notes: current.notes }));
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

  const fetchWithPasswordPublicProject: FetchWithPasswordPublicProjectType = (password) => {
    // get id
    const shareUrl = window.location.pathname.split("/").slice(-1)[0];
    return api.openShare(shareUrl, password);
  };

  const promptForSharePassword = (message: React.ReactElement): void => {
    createPrompt({
      msg: (
        <div>
          <h2 className="mb-2 text-xl font-bold text-themeAccent">
            <a href="/">VideoNote</a>
          </h2>
          {message}
        </div>
      ),
      passwordRequired: true,
      action: async (data: any) => {
        cancelPrompt();
        const { password } = data;
        setTimeout(async () => {
          // get password and send again
          handleShareAccess(await fetchWithPasswordPublicProject(password));
        }, 300);
      },
    });
  };

  // A guest reads a Share through the public route only; its reply is the whole project.
  const handleShareAccess = (access: ShareAccess): void => {
    switch (access.kind) {
      case "passwordRequired":
        return promptForSharePassword(
          <span className="whitespace-pre">
            A <span className="text-themeAccent">password </span>
            is required to access this project
          </span>,
        );
      case "incorrect":
        return promptForSharePassword(
          <span className="whitespace-pre">
            The <span className="text-themeAccent">password </span>
            is incorrect. Do you want to try again?
          </span>,
        );
      case "ok":
        setProjects([access.project]);
        setCurrentProject(access.project);
        alertProjectLoaded(access.project);
        return;
      case "notFound":
      case "error":
        // redirect to homepage for a guest
        addAlert({
          type: "error",
          msg: access.kind === "error" ? access.msg : "Share url does not exist.",
        });
        Router.push("/");
    }
  };

  //-------------------------------
  const handleInitialServerData: HandleInitialServerDataType = (data) => {
    if (data.share) return handleShareAccess(data.share);

    const account = startSession(data);
    if (!account) return;
    const { projects, settings } = account;
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
      // setCurrentProject(currentProject)
      // alertProjectLoaded(currentProject)
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

  const checkCanEdit: CheckCanEditType = () => {
    return admin || ((currentProject?.share ?? {}) as ShareProjectInterface).canEdit;
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

  const value: GlobalContextInterface = {
    projects,
    removeProject,
    project: currentProject,
    createProject,
    loadProject,
    updateProject,
    handleInitialServerData,
    noteApi,
    noteApiRemoveDoneNotes,
    updateProjectsStateWithUpdatedNotes,
    shareProject,
    removeShareProject,
    checkCanEdit,
    warnLocalVideo,
    projectsExist,
  };

  return (
    <globalContext.Provider value={value} {...props}>
      {children}
    </globalContext.Provider>
  );
};

export const useGlobalContext = (): GlobalContextInterface => {
  return useContext(globalContext);
};
