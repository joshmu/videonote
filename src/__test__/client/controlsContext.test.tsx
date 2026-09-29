import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ControlsProvider } from "@/context/controlsContext";

const mocks = vi.hoisted(() => ({
  uiShell: {
    toggleSidebar: vi.fn(),
    toggleMenuOpen: vi.fn(),
    cancelModals: vi.fn(),
  },
  video: {
    togglePlay: vi.fn(),
    jumpBack: vi.fn(),
    jumpForward: vi.fn(),
    changeVolume: vi.fn(),
    seekTo: vi.fn(),
  },
  note: {
    notes: [] as { _id: string; content: string; time: number }[],
    currentNote: null as { _id: string; content: string; time: number } | null,
  },
}));

vi.mock("@/context/uiShellContext", () => ({ useUiShellContext: () => mocks.uiShell }));
vi.mock("@/context/videoContext", () => ({ useVideoContext: () => mocks.video }));
vi.mock("@/context/noteContext", () => ({ useNoteContext: () => mocks.note }));

const renderControls = () => render(<ControlsProvider />);

const pressShiftArrow = (key: "ArrowLeft" | "ArrowRight") => {
  fireEvent.keyDown(window, { key: "Shift" });
  fireEvent.keyDown(window, { key });
};

/**
 * Dispatches a keydown the way a browser does: microtasks run after each
 * listener, so React commits (and runs effects) between listeners. A listener
 * removed mid-dispatch is skipped; one added mid-dispatch waits for the next event.
 */
const trackKeydownListeners = () => {
  const listeners: EventListener[] = [];
  const add = window.addEventListener.bind(window);
  const remove = window.removeEventListener.bind(window);
  vi.spyOn(window, "addEventListener").mockImplementation((type, listener, options) => {
    if (type === "keydown") listeners.push(listener as EventListener);
    add(type, listener, options);
  });
  vi.spyOn(window, "removeEventListener").mockImplementation((type, listener, options) => {
    if (type === "keydown") listeners.splice(listeners.indexOf(listener as EventListener), 1);
    remove(type, listener, options);
  });
  return async (key: string) => {
    const event = new KeyboardEvent("keydown", { key });
    for (const listener of listeners.slice()) {
      if (!listeners.includes(listener)) continue;
      await act(async () => listener(event));
    }
  };
};

afterEach(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.note.notes = [
    { _id: "a", content: "later", time: 30 },
    { _id: "b", content: "earlier", time: 10 },
  ];
  mocks.note.currentNote = null;
});

describe("controlsContext", () => {
  it("cancels modals once per escape press", () => {
    renderControls();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(mocks.uiShell.cancelModals).toHaveBeenCalledTimes(1);
  });

  it("ignores shift+arrow when there is no current note", () => {
    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => {
      errors.push(event.error);
      event.preventDefault();
    };
    window.addEventListener("error", onError);
    renderControls();

    pressShiftArrow("ArrowRight");
    window.removeEventListener("error", onError);

    expect(errors).toEqual([]);
    expect(mocks.video.seekTo).not.toHaveBeenCalled();
  });

  it("seeks to the next note without reordering the notes state", () => {
    mocks.note.currentNote = mocks.note.notes[1];
    renderControls();

    pressShiftArrow("ArrowRight");

    expect(mocks.video.seekTo).toHaveBeenCalledWith(30, { offset: false });
    expect(mocks.note.notes.map((n) => n._id)).toEqual(["a", "b"]);
  });

  it("opens the menu on Alt when the browser commits between keydown listeners", async () => {
    const pressInBrowser = trackKeydownListeners();
    renderControls();

    await pressInBrowser("Alt");

    expect(mocks.uiShell.toggleMenuOpen).toHaveBeenCalledTimes(1);
  });

  it("plays on space when the browser commits between keydown listeners", async () => {
    const pressInBrowser = trackKeydownListeners();
    renderControls();

    await pressInBrowser(" ");

    expect(mocks.video.togglePlay).toHaveBeenCalledTimes(1);
  });
});
