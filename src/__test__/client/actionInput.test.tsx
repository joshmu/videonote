import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ActionInput } from "@/components/ActionInput/ActionInput";

const mocks = vi.hoisted(() => ({
  canEdit: true,
  project: { _id: "p1" } as object | null,
  playedSeconds: 0 as number | undefined,
  addNote: vi.fn(),
}));

vi.mock("@/context/sharedProjectContext", () => ({
  useSharedProjectContext: () => ({ checkCanEdit: () => mocks.canEdit }),
}));
vi.mock("@/context/projectsContext", () => ({
  useProjectsContext: () => ({ project: mocks.project }),
}));
vi.mock("@/context/sessionContext", () => ({
  useSessionContext: () => ({ settings: { showHints: false } }),
}));
vi.mock("@/context/uiShellContext", () => ({
  useUiShellContext: () => ({
    sidebarOpen: true,
    actionInputRef: createRef(),
    actionInputFocus: vi.fn(),
  }),
}));
vi.mock("@/context/videoContext", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useVideoContext: () => ({
    progress: { playedSeconds: mocks.playedSeconds, played: 0 },
    duration: 60,
    seekTo: vi.fn(),
    action: null,
  }),
}));
vi.mock("@/context/controlsContext", () => ({
  useControlsContext: () => ({ toggleSmartControls: vi.fn() }),
}));
vi.mock("@/context/noteContext", () => ({
  useNoteContext: () => ({ addNote: mocks.addNote, notes: [] }),
}));

// A .js file with JSX, which the test transform does not parse.
vi.mock("@/shared/TimeDisplay/TimeDisplay", () => ({ default: () => null }));

beforeEach(() => {
  mocks.canEdit = true;
  mocks.project = { _id: "p1" };
  mocks.playedSeconds = 0;
  mocks.addNote.mockClear();
});

const submitNote = (content: string) => {
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: content } });
  fireEvent.keyDown(input, { key: "Enter" });
};

describe("ActionInput", () => {
  it("shows the note input to a viewer who can edit", () => {
    render(<ActionInput />);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.queryByText("View only")).not.toBeInTheDocument();
  });

  it("hides the note input from a viewer who cannot edit and says it is view only", () => {
    mocks.canEdit = false;

    render(<ActionInput />);

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("View only")).toBeInTheDocument();
  });

  it("keeps the input while no project is on screen yet", () => {
    mocks.canEdit = false;
    mocks.project = null;

    render(<ActionInput />);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("stamps a new note with the player position", () => {
    mocks.playedSeconds = 12;
    render(<ActionInput />);

    submitNote("Trim the intro");

    expect(mocks.addNote).toHaveBeenCalledWith({ content: "Trim the intro", time: 12 });
  });

  it.each([
    ["a non-finite", Number.NaN],
    ["no", undefined],
  ])("leaves the time unset when the player reports %s position", (_label, playedSeconds) => {
    mocks.playedSeconds = playedSeconds;
    render(<ActionInput />);

    submitNote("Trim the intro");

    expect(mocks.addNote).toHaveBeenCalledWith({ content: "Trim the intro", time: undefined });
  });
});
