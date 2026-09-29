import type { ApiClient, SessionStore } from "@/utils/apiClient";

import { GlobalProvider } from "./globalContext";
import { SessionProvider } from "./sessionContext";
import { UiShellProvider } from "./uiShellContext";

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
      <GlobalProvider serverData={serverData}>{children}</GlobalProvider>
    </SessionProvider>
  </UiShellProvider>
);
