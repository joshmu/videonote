import Router from "next/router";
import { createContext, useContext, useRef, useState } from "react";

import { SETTINGS_DEFAULTS } from "@/shared/constants";
import type { ProjectInterface, SettingsInterface, UserInterface } from "@/shared/types";
import {
  type ApiClient,
  type ApiFailure,
  browserApi,
  browserSession,
  type SessionStore,
} from "@/utils/apiClient";

import { useNotificationContext } from "./notificationContext";

export type UpdateUserType = (
  userData: UserInterface | { username: string; email: string },
) => Promise<void>;
export type UpdateSettingsType = (newSettingsData: { [key: string]: any }) => Promise<void>;
export type RemoveAccountType = (userData: UserInterface) => Promise<void>;
/** What a started session hands on: the account's projects and its stored settings. */
export type SessionAccount = { projects: ProjectInterface[]; settings?: SettingsInterface };

interface SessionContextInterface {
  api: ApiClient;
  user: UserInterface;
  admin: boolean;
  settings: SettingsInterface;
  startSession: (serverData: { [key: string]: any }) => SessionAccount | null;
  updateUser: UpdateUserType;
  updateSettings: UpdateSettingsType;
  removeAccount: RemoveAccountType;
  reportFailure: (failure: ApiFailure) => void;
}

const sessionContext = createContext<SessionContextInterface>(null!);

/** The signed-in User, their Settings and the API client every provider calls through. */
export const SessionProvider = ({
  children,
  api = browserApi,
  sessionStore = browserSession,
}: {
  children: React.ReactNode;
  api?: ApiClient;
  sessionStore?: SessionStore;
}) => {
  const [user, setUser] = useState<UserInterface>(null!);
  const [settings, setSettings] = useState<SettingsInterface>(SETTINGS_DEFAULTS);

  // guest until the account is loaded; the ref lets actions started during
  // hydration (e.g. updateSettings from loadProject) see the value just set
  const [admin, setAdminState] = useState<boolean>(false);
  const adminRef = useRef<boolean>(false);
  const setAdmin = (value: boolean): void => {
    adminRef.current = value;
    setAdminState(value);
  };

  const { addAlert } = useNotificationContext();

  const reportFailure = (failure: ApiFailure): void => {
    if (failure.kind === "unauthorized") {
      addAlert({ type: "error", msg: "Session expired, please re-enter your credentials" });
      Router.push("/login");
      return;
    }
    addAlert({ type: "error", msg: failure.msg });
  };

  const startSession = (data: { [key: string]: any }): SessionAccount | null => {
    // a msg or a missing user means the server could not load the account
    if (data.msg || !data.user) {
      Router.push("/login");
      addAlert({ type: "error", msg: data.msg ?? "Could not load your account." });
      return null;
    }

    // grab user projects as seperate var and rest is the account
    const { projects = [], ...userAccount } = data.user;
    const { settings, ...user }: { settings: SettingsInterface } = userAccount;

    setAdmin(true);
    setUser(user as UserInterface);

    // avoid null values from mongo
    // if we have any null property values in returned settings then replace with defaults
    if (typeof settings === "object" && settings !== null) {
      Object.keys(settings).forEach((key) => {
        if (settings[key] === null) settings[key] = SETTINGS_DEFAULTS[key];
      });
      setSettings({ ...SETTINGS_DEFAULTS, ...settings });
    }

    addAlert({
      type: "success",
      msg: `Logged in: ${(user as UserInterface).username}`,
    });

    return { projects, settings };
  };

  const updateUser: UpdateUserType = async (userData) => {
    const result = await api.updateUser(userData);
    if (result.kind !== "ok") return reportFailure(result);
    // the profile reply carries no settings; those change through updateSettings
    setUser(result.data.user);
  };

  const updateSettings: UpdateSettingsType = async (newSettingsData) => {
    if (!adminRef.current) return;

    const result = await api.updateSettings(newSettingsData);
    if (result.kind !== "ok") return reportFailure(result);

    // any settings which are not present from DB we fill with defaults
    const fullSettings = { ...SETTINGS_DEFAULTS, ...result.data.settings };

    setSettings(fullSettings);
  };

  const removeAccount: RemoveAccountType = async (userData) => {
    console.log("removing account", userData.username);

    // use passed data otherwise use current user information in global state
    const result = await api.removeAccount(userData || user);
    if (result.kind === "wrongPassword") {
      addAlert({ type: "error", msg: result.msg });
      return;
    }
    if (result.kind !== "ok") return reportFailure(result);

    addAlert({ type: "success", msg: "Account removed. Goodbye! 👋" });

    sessionStore.remove();

    // redirect to landing page
    Router.push("/hello");
  };

  const value: SessionContextInterface = {
    api,
    user,
    admin,
    settings,
    startSession,
    updateUser,
    updateSettings,
    removeAccount,
    reportFailure,
  };

  return <sessionContext.Provider value={value}>{children}</sessionContext.Provider>;
};

export const useSessionContext = (): SessionContextInterface => useContext(sessionContext);
