import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CurrentProjectModal } from "@/components/Modals/CurrentProjectModal/CurrentProjectModal";
import { ShareProjectModal } from "@/components/Modals/ShareProjectModal/ShareProjectModal";

const mocks = vi.hoisted(() => ({ global: {} as Record<string, any> }));

vi.mock("@/context/globalContext", () => ({ useGlobalContext: () => mocks.global }));
vi.mock("@/context/notificationContext", () => ({
  useNotificationContext: () => ({ addAlert: vi.fn() }),
}));

const project = {
  _id: "p1",
  title: "Rough cut",
  src: "https://example.com/v.mp4",
  user: "u1",
  share: { _id: "s1", url: "rough-cut", canEdit: true },
  notes: [{ _id: "n1", content: "Trim", project: "p1" }],
};

// the same project after a note was added: a new object with the same _id and share
const withAnotherNote = () => ({
  ...mocks.global.project,
  notes: [...mocks.global.project.notes, { _id: "n2", content: "Grade", project: "p1" }],
});

const input = (container: HTMLElement, id: string) =>
  container.querySelector<HTMLInputElement>(`#${id}`)!;

beforeEach(() => {
  mocks.global = {
    project,
    updateProject: vi.fn(),
    shareProject: vi.fn(),
    removeShareProject: vi.fn(),
  };
});

describe("project modals keep edits across note changes", () => {
  it("CurrentProjectModal keeps a typed title when a note is added", () => {
    const modal = () => <CurrentProjectModal toggle={vi.fn()} motionKey="current" />;
    const { container, rerender } = render(modal());
    fireEvent.change(input(container, "title"), { target: { id: "title", value: "Final cut" } });

    mocks.global.project = withAnotherNote();
    rerender(modal());

    expect(input(container, "title").value).toBe("Final cut");
  });

  it("CurrentProjectModal picks up a different project", () => {
    const modal = () => <CurrentProjectModal toggle={vi.fn()} motionKey="current" />;
    const { container, rerender } = render(modal());
    fireEvent.change(input(container, "title"), { target: { id: "title", value: "Final cut" } });

    mocks.global.project = { ...project, _id: "p2", title: "Other" };
    rerender(modal());

    expect(input(container, "title").value).toBe("Other");
  });

  it("ShareProjectModal keeps a typed url when a note is added", () => {
    const modal = () => <ShareProjectModal toggle={vi.fn()} motionKey="share" />;
    const { container, rerender } = render(modal());
    fireEvent.change(input(container, "url"), { target: { id: "url", value: "final" } });

    mocks.global.project = withAnotherNote();
    rerender(modal());

    expect(input(container, "url").value).toBe("final");
  });

  it("ShareProjectModal picks up a saved share", () => {
    const modal = () => <ShareProjectModal toggle={vi.fn()} motionKey="share" />;
    const { container, rerender } = render(modal());
    fireEvent.change(input(container, "url"), { target: { id: "url", value: "final" } });

    mocks.global.project = { ...project, share: { ...project.share, url: "saved" } };
    rerender(modal());

    expect(input(container, "url").value).toBe("saved");
  });
});
