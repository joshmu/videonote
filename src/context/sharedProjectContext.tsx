import Router from "next/router";
import { createContext, useContext } from "react";

import type { ShareProjectInterface } from "@/shared/types";
import type { ShareAccess } from "@/utils/apiClient";

import { useNotificationContext } from "./notificationContext";
import { useProjectsContext } from "./projectsContext";
import { useSessionContext } from "./sessionContext";
import { useUiShellContext } from "./uiShellContext";

type FetchWithPasswordPublicProjectType = (password: string) => Promise<ShareAccess>;
type CheckCanEditType = () => boolean;

interface SharedProjectContextInterface {
  handleShareAccess: (access: ShareAccess) => void;
  checkCanEdit: CheckCanEditType;
}

const sharedProjectContext = createContext<SharedProjectContextInterface>(null!);

/** Opening a public Share (with its password prompt) and whether the viewer may edit its Notes. */
export const SharedProjectProvider = ({ children }: { children: React.ReactNode }) => {
  const { addAlert } = useNotificationContext();
  const { api, admin } = useSessionContext();
  const { project: currentProject, showSharedProject } = useProjectsContext();
  const { createPrompt, cancelPrompt } = useUiShellContext();

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
        showSharedProject(access.project);
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

  const checkCanEdit: CheckCanEditType = () => {
    return admin || ((currentProject?.share ?? {}) as ShareProjectInterface).canEdit;
  };

  const value: SharedProjectContextInterface = {
    handleShareAccess,
    checkCanEdit,
  };

  return <sharedProjectContext.Provider value={value}>{children}</sharedProjectContext.Provider>;
};

export const useSharedProjectContext = (): SharedProjectContextInterface =>
  useContext(sharedProjectContext);
