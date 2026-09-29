import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
});
