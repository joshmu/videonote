import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NoteItem } from "@/components/NoteList/NoteItem/NoteItem";

const mocks = vi.hoisted(() => ({ user: { _id: "u1" } as object | null }));

vi.mock("@/context/projectsContext", () => ({
  useProjectsContext: () => ({ project: { _id: "p1", share: { canEdit: true } } }),
}));
vi.mock("@/context/sessionContext", () => ({
  useSessionContext: () => ({ admin: true, user: mocks.user }),
}));
vi.mock("@/context/videoContext", () => ({ useVideoContext: () => ({ seekTo: vi.fn() }) }));
vi.mock("@/context/controlsContext", () => ({
  useControlsContext: () => ({ toggleSmartControls: vi.fn() }),
}));
vi.mock("@/context/noteContext", () => ({ useNoteContext: () => ({ updateNote: vi.fn() }) }));

// A .js file with JSX, which the test transform does not parse.
vi.mock("@/shared/TimeDisplay/TimeDisplay", () => ({ default: () => null }));

const note = (user?: object) => ({ _id: "n1", content: "Trim", time: 3, project: "p1", user });

const renderNote = (user?: object) =>
  render(<NoteItem note={note(user) as never} closestProximity={false} childVariants={{}} />);

beforeEach(() => {
  mocks.user = { _id: "u1" };
});

describe("NoteItem", () => {
  it("hides the author label on the viewer's own note and shows it on others", () => {
    const { container, unmount } = renderNote({ _id: "u1", role: "owner" });
    expect(container.textContent).toBe("Trim");
    unmount();

    expect(renderNote({ _id: "u2", role: "member" }).container.textContent).toContain("member");
  });
});
