import { useEffect } from "react";

import type { ApiClient, SessionStore } from "@/utils/apiClient";

import { ProjectsProvider, useProjectsContext } from "./projectsContext";
import { SessionProvider, useSessionContext } from "./sessionContext";
import { SharedProjectProvider, useSharedProjectContext } from "./sharedProjectContext";
import { UiShellProvider } from "./uiShellContext";

/**
 * Hands the page's server data to its owner once: a Share to the shared-project
 * access, otherwise the account to the session and its projects to the projects.
 */
const LoadServerData = ({ serverData }: { serverData: { [key: string]: any } }) => {
  const { startSession } = useSessionContext();
  const { openProjects } = useProjectsContext();
  const { handleShareAccess } = useSharedProjectContext();

  useEffect(() => {
    if (serverData.share) return handleShareAccess(serverData.share);

    const account = startSession(serverData);
    if (account) openProjects(account);
  }, []);

  return null;
};

/**
 * The app-wide providers in dependency order, loaded with the page's server
 * data. `api` and `sessionStore` default to the browser's.
 */
export const AppProviders = ({
  serverData,
  api,
  sessionStore,
  children,
}: {
  serverData: {};
  api?: ApiClient;
  sessionStore?: SessionStore;
  children: React.ReactElement;
}) => (
  <UiShellProvider>
    <SessionProvider api={api} sessionStore={sessionStore}>
      <ProjectsProvider>
        <SharedProjectProvider>
          {children}
          <LoadServerData serverData={serverData} />
        </SharedProjectProvider>
      </ProjectsProvider>
    </SessionProvider>
  </UiShellProvider>
);
