import { type MutableRefObject, createContext, useContext, useRef, useState } from "react";

import { ModalType } from "@/components/Modals/Modals";
import {
  type CancelPromptType,
  type ConfirmPromptType,
  type CreatePromptType,
  type PromptInterface,
  usePrompt,
} from "@/hooks/usePrompt";

export type ToggleMenuOpenType = (state?: boolean) => void;
export type ToggleSidebarType = (state?: boolean) => void;
export type ToggleModalOpenType = (modalName?: ModalType) => void;

interface UiShellContextInterface {
  sidebarOpen: boolean;
  toggleSidebar: ToggleSidebarType;
  menuOpen: boolean;
  toggleMenuOpen: ToggleMenuOpenType;
  modalsOpen: ModalType[];
  toggleModalOpen: ToggleModalOpenType;
  promptState: PromptInterface;
  createPrompt: CreatePromptType;
  confirmPrompt: ConfirmPromptType;
  cancelPrompt: CancelPromptType;
  cancelModals: () => void;
  actionInputRef: MutableRefObject<HTMLInputElement | null>;
  actionInputFocus: () => void;
}

const uiShellContext = createContext<UiShellContextInterface>(null!);

/** Sidebar, menu, modals, prompt and the action input: UI state with no server calls. */
export const UiShellProvider = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [modalsOpen, setModalsOpen] = useState<ModalType[]>([]);
  const actionInputRef = useRef<HTMLInputElement | null>(null);
  const { promptState, createPrompt, confirmPrompt, cancelPrompt } = usePrompt();

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
  };

  const cancelModals = (): void => {
    console.log("cancel modals");
    if (modalsOpen.length > 0) setModalsOpen([]);
    if (promptState.isOpen) cancelPrompt();
    if (menuOpen) setMenuOpen(false);
  };

  const actionInputFocus = (): void => {
    console.log("autoFocus");
    // A viewer who cannot edit has no note input.
    actionInputRef.current?.focus();
  };

  const value: UiShellContextInterface = {
    sidebarOpen,
    toggleSidebar,
    menuOpen,
    toggleMenuOpen,
    modalsOpen,
    toggleModalOpen,
    promptState,
    createPrompt,
    confirmPrompt,
    cancelPrompt,
    cancelModals,
    actionInputRef,
    actionInputFocus,
  };

  return <uiShellContext.Provider value={value}>{children}</uiShellContext.Provider>;
};

export const useUiShellContext = (): UiShellContextInterface => useContext(uiShellContext);
