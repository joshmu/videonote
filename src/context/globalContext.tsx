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
import { createContext, useContext, useEffect, useRef, useState } from "react";

import { usePrompt } from "@/hooks/usePrompt";
import {
  ProjectApiActions,
  ProjectInterface,
  SettingsInterface,
  ShareProjectInterface,
  UserInterface,
} from "@/root/src/components/shared/types";
import { type ApiFailure, browserApi, browserSession, type ShareAccess } from "@/utils/apiClient";

import { ModalType } from "../components/Modals/Modals";
import {
  ActionInputFocusType,
  AlertProjectLoadedType,
  CancelModalsType,
  CheckCanEditType,
  CopyToClipboardType,
  CreateProjectType,
  FetchWithPasswordPublicProjectType,
  GlobalContextInterface,
  HandleInitialServerDataType,
  LoadProjectType,
  NoteApiRemoveDoneNotes,
  NoteApiType,
  ProjectApiType,
  RemoveAccountType,
  RemoveProjectType,
  RemoveShareProjectType,
  ShareProjectType,
  ToggleMenuOpenType,
  ToggleModalOpenType,
  ToggleSidebarType,
  UpdateProjectType,
  UpdateProjectsStateWithUpdatedNotesType,
  UpdateSettingsType,
  UpdateUserType,
  WarnLocalVideoType,
} from "./globalContext.types";
import { useNotificationContext } from "./notificationContext";

const SETTINGS_DEFAULTS: SettingsInterface = {
  playOffset: -4,
  showHints: true,
  seekJump: 10,
  sidebarWidth: 400,
  currentProject: null,
};

const HINTS: string[] = [
  "Spacebar = Play/Pause",
  "Left/Right = Seek",
  "Up/Down = Volume",
  "Shift + Spacebar = show/hide notes",
  "Click note to jump to time",
  "Mark notes done by clicking their time",
  "Double click note = Edit",
  "Shift + Left/Right = Prev/Next note",
  "Click video timeline to jump",
  "Drag list edge to resize",
];

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
  const [user, setUser] = useState<UserInterface>(null!);
  const [projects, setProjects] = useState<ProjectInterface[]>([]);
  const [settings, setSettings] = useState<SettingsInterface>(SETTINGS_DEFAULTS);

  const [currentProject, setCurrentProject] = useState<ProjectInterface>(null!);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [modalsOpen, setModalsOpen] = useState<ModalType[]>([]);
  const actionInputRef = useRef<HTMLInputElement | null>(null);

  // guest until the account is loaded; the ref lets actions started during
  // hydration (e.g. updateSettings from loadProject) see the value just set
  const [admin, setAdminState] = useState<boolean>(false);
  const adminRef = useRef<boolean>(false);
  const setAdmin = (value: boolean): void => {
    adminRef.current = value;
    setAdminState(value);
  };

  const { addAlert } = useNotificationContext();
  const { promptState, createPrompt, confirmPrompt, cancelPrompt } = usePrompt();

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
    const result = await browserApi.saveNote(noteData);
    if (result.kind !== "ok") {
      reportFailure(result);
      return "error";
    }
    return result.data.note;
  };

  const noteApiRemoveDoneNotes: NoteApiRemoveDoneNotes = async () => {
    const result = await browserApi.removeDoneNotes(currentProject._id);
    if (result.kind !== "ok") {
      reportFailure(result);
      return "error";
    }
    return result.data.notes;
  };

  const updateProject: UpdateProjectType = async (projectData) => {
    if (!adminRef.current) return;

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

  const updateUser: UpdateUserType = async (userData) => {
    const result = await browserApi.updateUser(userData);
    if (result.kind !== "ok") return reportFailure(result);
    // the profile reply carries no settings; those change through updateSettings
    setUser(result.data.user);
  };

  const updateSettings: UpdateSettingsType = async (newSettingsData) => {
    if (!adminRef.current) return;

    const result = await browserApi.updateSettings(newSettingsData);
    if (result.kind !== "ok") return reportFailure(result);

    // any settings which are not present from DB we fill with defaults
    const fullSettings = { ...SETTINGS_DEFAULTS, ...result.data.settings };

    setSettings(fullSettings);
  };

  const toggleMenuOpen: ToggleMenuOpenType = (state = undefined) => {
    setMenuOpen(state ?? !menuOpen);
  };

  const toggleSidebar: ToggleSidebarType = (state = undefined) => {
    setSidebarOpen((currentState) => state ?? !currentState);
  };

  const toggleModalOpen: ToggleModalOpenType = (modalName = undefined) => {
    console.log("opening modal", modalName);
    // if no param then turn off modals
    if (!modalName) return setModalsOpen([]);
    // if modal name exists then find it and remove from modals open list
    if (modalsOpen.includes(modalName))
      return setModalsOpen((currentModals) => currentModals.filter((modal) => modal !== modalName));
    // otherwise add modal to list of open modals
    setModalsOpen((currentModals) => [...currentModals, modalName]);
    // setModalsOpen(modalsOpen === modalName ? null : modalName)
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
    return browserApi.openShare(shareUrl, password);
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
        setAdmin(false);
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

    // ERROR
    // a msg or a missing user means the server could not load the account
    if (data.msg || !data.user) {
      Router.push("/login");
      addAlert({ type: "error", msg: data.msg ?? "Could not load your account." });
      return;
    }

    // PARSE SERVER DATA
    // grab user projects as seperate var and rest is the account
    const { projects = [], ...userAccount } = data.user;
    const { settings, ...user }: { settings: SettingsInterface } = userAccount;

    // HANDLE DATA
    // allocate server data to respective areas
    setProjects(projects);

    setAdmin(true);
    setUser(user as UserInterface);

    // avoid null values from mongo
    // if we have any null property values in returned settings then replace with defaults
    if (typeof settings === "object" && settings !== null) {
      // if we have any null settings lets swap them to their defaults
      Object.keys(settings).forEach((key) => {
        if (settings[key] === null) settings[key] = SETTINGS_DEFAULTS[key];
      });
      setSettings({ ...SETTINGS_DEFAULTS, ...settings });
    }

    addAlert({
      type: "success",
      msg: `Logged in: ${(user as UserInterface).username}`,
    });

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
    const result = await browserApi.project(action, project, share);
    if (result.kind !== "ok") return reportFailure(result);
    return result.data;
  };

  const copyToClipboard: CopyToClipboardType = (txt, alertMsg = "Copied to clipboard!") => {
    if (!txt) return;

    // copy to clipboard
    navigator.clipboard.writeText(txt).then(
      function () {
        /* clipboard successfully set */
        addAlert({ type: "info", msg: `${alertMsg} ${txt}` });
      },
      function () {
        /* clipboard write failed */
        console.log("clipboard copy failed");
      },
    );
  };

  const reportFailure = (failure: ApiFailure): void => {
    if (failure.kind === "unauthorized") {
      addAlert({ type: "error", msg: "Session expired, please re-enter your credentials" });
      Router.push("/login");
      return;
    }
    addAlert({ type: "error", msg: failure.msg });
  };

  const removeAccount: RemoveAccountType = async (userData) => {
    console.log("removing account", userData.username);

    // use passed data otherwise use current user information in global state
    const result = await browserApi.removeAccount(userData || user);
    // a 401 here is a wrong password, so show it rather than ending the session
    if (result.kind !== "ok") {
      addAlert({ type: "error", msg: result.msg });
      return;
    }

    addAlert({ type: "success", msg: "Account removed. Goodbye! 👋" });

    browserSession.remove();

    // redirect to landing page
    Router.push("/hello");
  };

  const cancelModals: CancelModalsType = () => {
    console.log("cancel modals");
    if (modalsOpen.length > 0) setModalsOpen([]);
    if (promptState.isOpen) cancelPrompt();
    if (menuOpen) setMenuOpen(false);
  };

  const checkCanEdit: CheckCanEditType = () => {
    return admin || ((currentProject?.share ?? {}) as ShareProjectInterface).canEdit;
  };

  const actionInputFocus: ActionInputFocusType = () => {
    console.log("autoFocus");
    actionInputRef.current.focus();
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
    user,
    updateUser,
    projects,
    removeProject,
    project: currentProject,
    settings,
    updateSettings,
    menuOpen,
    toggleMenuOpen,
    modalsOpen,
    toggleModalOpen,
    createProject,
    loadProject,
    sidebarOpen,
    toggleSidebar,
    updateProject,
    handleInitialServerData,
    SETTINGS_DEFAULTS,
    HINTS,
    admin,
    copyToClipboard,
    removeAccount,
    promptState,
    createPrompt,
    confirmPrompt,
    cancelPrompt,
    cancelModals,
    noteApi,
    noteApiRemoveDoneNotes,
    updateProjectsStateWithUpdatedNotes,
    shareProject,
    removeShareProject,
    checkCanEdit,
    actionInputRef,
    actionInputFocus,
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
