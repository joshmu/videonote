/**
 * @path /src/components/Sidebar/Sidebar.tsx
 *
 * @project videonote
 * @file Sidebar.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Sunday, 20th September 2020
 * @modified Wednesday, 25th November 2020 8:56:56 pm
 * @copyright © 2020 - 2020 MU
 */

import { Variants, motion } from "motion/react";
import { type CSSProperties, useEffect } from "react";

import { NoteList } from "@/components/NoteList/NoteList";
import { useSessionContext } from "@/context/sessionContext";
import { useUiShellContext } from "@/context/uiShellContext";
import { useResizable } from "@/hooks/useResizable";
import { SETTINGS_DEFAULTS } from "@/shared/constants";

import { SidebarFooter } from "./SidebarFooter/SidebarFooter";
import { SidebarHeader } from "./SidebarHeader/SidebarHeader";

const sidebarVariants: Variants = {
  initial: {
    opacity: 0,
    x: "100%",
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: "100%",
  },
};

export const Sidebar = (props: { [key: string]: any }) => {
  const { settings, updateSettings } = useSessionContext();
  const { sidebarOpen } = useUiShellContext();

  const { state: resizeState, handleStartResize } = useResizable({
    initialSize: settings.sidebarWidth,
    defaultSize: SETTINGS_DEFAULTS.sidebarWidth,
  });

  // update sidebar width once resizing completes
  // don't fire if its the initial default values
  useEffect(() => {
    // don't update durting resize
    if (resizeState.resizing) return;
    // don't update if we are just setting defaults
    if (resizeState.size === SETTINGS_DEFAULTS.sidebarWidth) return;
    // don't update if we are settings the server response
    if (resizeState.size === settings.sidebarWidth) return;

    // console.log('updating sidebar width', { resizeState })
    console.log("fire from sidebar");
    updateSettings({ sidebarWidth: resizeState.size });
  }, [resizeState]);

  return (
    <motion.div
      key="sidebar"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={sidebarVariants}
      id="sidebar"
      style={
        {
          "--sidebar-width": `${sidebarOpen ? resizeState.size : 0}px`,
          "--sidebar-inner-width": `${resizeState.size}px`,
        } as CSSProperties
      }
      // a phone stacks it under the player at full width; only wider screens resize or close it
      className="relative flex flex-col flex-1 w-full min-h-0 transition-all duration-500 ease-in-out border-t md:flex-none md:h-auto md:border-t-0 md:border-l border-themeText2 md:w-(--sidebar-width)"
      {...props}
    >
      {/* sidebar edge for resizing */}
      {sidebarOpen && (
        <div
          className="absolute left-0 z-10 hidden w-6 h-full transform -translate-x-4/5 md:block"
          style={{ cursor: "ew-resize" }}
          onMouseDown={handleStartResize}
        ></div>
      )}

      {/* sidebar inner wrapper to maintain width */}
      <div className="relative flex flex-col w-full h-full md:w-(--sidebar-inner-width)">
        <SidebarHeader />

        {/* sidebar content */}
        <div className="flex-1 w-full h-full overflow-auto scrollbar">
          <NoteList />
        </div>

        <SidebarFooter />
      </div>
    </motion.div>
  );
};
