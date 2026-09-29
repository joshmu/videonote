import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CurrentProjectModal } from "@/components/Modals/CurrentProjectModal/CurrentProjectModal";
import { ShareProjectModal } from "@/components/Modals/ShareProjectModal/ShareProjectModal";

const mocks = vi.hoisted(() => ({ projects: {} as Record<string, any> }));

vi.mock("@/context/projectsContext", () => ({ useProjectsContext: () => mocks.projects }));
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
  ...mocks.projects.project,
  notes: [...mocks.projects.project.notes, { _id: "n2", content: "Grade", project: "p1" }],
});

const input = (container: HTMLElement, id: string) =>
  container.querySelector<HTMLInputElement>(`#${id}`)!;

beforeEach(() => {
  mocks.projects = {
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

    mocks.projects.project = withAnotherNote();
    rerender(modal());

    expect(input(container, "title").value).toBe("Final cut");
  });

  it("CurrentProjectModal picks up a different project", () => {
    const modal = () => <CurrentProjectModal toggle={vi.fn()} motionKey="current" />;
    const { container, rerender } = render(modal());
    fireEvent.change(input(container, "title"), { target: { id: "title", value: "Final cut" } });

    mocks.projects.project = { ...project, _id: "p2", title: "Other" };
    rerender(modal());

    expect(input(container, "title").value).toBe("Other");
  });

  it("ShareProjectModal keeps a typed url when a note is added", () => {
    const modal = () => <ShareProjectModal toggle={vi.fn()} motionKey="share" />;
    const { container, rerender } = render(modal());
    fireEvent.change(input(container, "url"), { target: { id: "url", value: "final" } });

    mocks.projects.project = withAnotherNote();
    rerender(modal());

    expect(input(container, "url").value).toBe("final");
  });

  it("ShareProjectModal picks up a saved share", () => {
    const modal = () => <ShareProjectModal toggle={vi.fn()} motionKey="share" />;
    const { container, rerender } = render(modal());
    fireEvent.change(input(container, "url"), { target: { id: "url", value: "final" } });

    mocks.projects.project = { ...project, share: { ...project.share, url: "saved" } };
    rerender(modal());

    expect(input(container, "url").value).toBe("saved");
  });
});

describe("ShareProjectModal fields", () => {
  const renderShare = () =>
    render(<ShareProjectModal toggle={vi.fn()} motionKey="share" />).container;
  const type = (container: HTMLElement, id: string, value: string) =>
    fireEvent.change(input(container, id), { target: { id, value } });

  it("keeps the url when the password is typed after it", () => {
    mocks.projects.project = { ...project, share: undefined };
    const container = renderShare();

    type(container, "url", "Final Cut");
    type(container, "password", "hunter2");

    expect(input(container, "url").value).toBe("final-cut");
    expect(input(container, "password").value).toBe("hunter2");
  });

  it("keeps the url when edit access is toggled", () => {
    mocks.projects.project = { ...project, share: undefined };
    const container = renderShare();

    type(container, "url", "final");
    fireEvent.click(screen.getByText("Users can edit notes."));

    expect(input(container, "url").value).toBe("final");
  });
});
