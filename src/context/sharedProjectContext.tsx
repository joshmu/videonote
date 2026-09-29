import Router from "next/router";
import { createContext, useContext, useRef } from "react";

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
  /** The Share token for Note writes; none for an open Share or the owner's own Projects. */
  shareToken: () => string | undefined;
  /** Ask for the Share password again; resolves once a new Share token is held. */
  renewShareAccess: () => Promise<void>;
}

const sharedProjectContext = createContext<SharedProjectContextInterface>(null!);

/**
 * Opening a public Share (with its password prompt), the Share token it hands
 * out, and whether the viewer may edit its Notes.
 */
export const SharedProjectProvider = ({ children }: { children: React.ReactNode }) => {
  const { addAlert } = useNotificationContext();
  const { api, admin } = useSessionContext();
  const { project: currentProject, showSharedProject } = useProjectsContext();
  const { createPrompt, cancelPrompt } = useUiShellContext();

  // In memory only, for this page session.
  const shareTokenRef = useRef<string | undefined>(undefined);
  // Note writes waiting on a renewed Share token.
  const renewalRef = useRef<{ promise: Promise<void>; resolve: () => void } | null>(null);

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
      case "ok": {
        shareTokenRef.current = access.shareToken;
        const renewal = renewalRef.current;
        if (!renewal) return showSharedProject(access.project);
        // A renewal keeps the project on screen, with any unsent notes.
        renewalRef.current = null;
        renewal.resolve();
        return;
      }
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

  const renewShareAccess = (): Promise<void> => {
    if (!renewalRef.current) {
      let resolve!: () => void;
      const promise = new Promise<void>((done) => (resolve = done));
      renewalRef.current = { promise, resolve };
    }
    promptForSharePassword(
      <span className="whitespace-pre">
        Enter the <span className="text-themeAccent">password </span>
        again to save your notes
      </span>,
    );
    return renewalRef.current.promise;
  };

  const checkCanEdit: CheckCanEditType = () => {
    return admin || ((currentProject?.share ?? {}) as ShareProjectInterface).canEdit;
  };

  const value: SharedProjectContextInterface = {
    handleShareAccess,
    checkCanEdit,
    shareToken: () => shareTokenRef.current,
    renewShareAccess,
  };

  return <sharedProjectContext.Provider value={value}>{children}</sharedProjectContext.Provider>;
};

export const useSharedProjectContext = (): SharedProjectContextInterface =>
  useContext(sharedProjectContext);
