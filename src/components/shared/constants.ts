import type { SettingsInterface } from "./types";

/** Settings for any key the server leaves out or stores as null. */
export const SETTINGS_DEFAULTS: SettingsInterface = {
  playOffset: -4,
  showHints: true,
  seekJump: 10,
  sidebarWidth: 400,
  currentProject: null,
};

export const HINTS: string[] = [
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
