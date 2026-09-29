import { GlobalProvider } from "./globalContext";
import { SessionProvider } from "./sessionContext";
import { UiShellProvider } from "./uiShellContext";

/** The app-wide providers in dependency order, loaded with the page's server data. */
export const AppProviders = ({
  serverData,
  children,
}: {
  serverData: {};
  children: React.ReactElement;
}) => (
  <UiShellProvider>
    <SessionProvider>
      <GlobalProvider serverData={serverData}>{children}</GlobalProvider>
    </SessionProvider>
  </UiShellProvider>
);
