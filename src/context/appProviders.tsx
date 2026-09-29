import { GlobalProvider } from "./globalContext";
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
    <GlobalProvider serverData={serverData}>{children}</GlobalProvider>
  </UiShellProvider>
);
