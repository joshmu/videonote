import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateProjectModal } from "@/components/Modals/CreateProjectModal/CreateProjectModal";
import { CurrentProjectModal } from "@/components/Modals/CurrentProjectModal/CurrentProjectModal";
import { ShareProjectModal } from "@/components/Modals/ShareProjectModal/ShareProjectModal";
import { NOT_A_VIDEO_LINK } from "@/utils/videoLink";

const mocks = vi.hoisted(() => ({
  projects: {} as Record<string, any>,
  addAlert: vi.fn(),
}));

vi.mock("@/context/projectsContext", () => ({ useProjectsContext: () => mocks.projects }));
vi.mock("@/context/notificationContext", () => ({
  useNotificationContext: () => ({ addAlert: mocks.addAlert }),
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
  mocks.addAlert.mockClear();
  mocks.projects = {
    project,
    createProject: vi.fn(),
    updateProject: vi.fn(),
    shareProject: vi.fn(),
    removeShareProject: vi.fn(),
  };
});

describe("project modals check the video link", () => {
  const notALink = expect.objectContaining({ msg: NOT_A_VIDEO_LINK });

  const create = (title: string, src: string) => {
    const toggle = vi.fn();
    const { container } = render(<CreateProjectModal toggle={toggle} motionKey="create" />);
    fireEvent.change(input(container, "title"), { target: { id: "title", value: title } });
    fireEvent.change(input(container, "src"), { target: { id: "src", value: src } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    return toggle;
  };

  const update = (changes: Record<string, string>) => {
    const { container } = render(<CurrentProjectModal toggle={vi.fn()} motionKey="current" />);
    for (const [id, value] of Object.entries(changes))
      fireEvent.change(input(container, id), { target: { id, value } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
  };

  it("doesn't create a Project from a word, and keeps the form open", async () => {
    const toggle = create("Holiday", "holiday");

    await waitFor(() => expect(mocks.addAlert).toHaveBeenCalledWith(notALink));
    expect(mocks.projects.createProject).not.toHaveBeenCalled();
    expect(toggle).not.toHaveBeenCalled();
  });

  it("creates a Project from a link missing its scheme", async () => {
    create("Holiday", "youtube.com/watch?v=abc");

    await waitFor(() =>
      expect(mocks.projects.createProject).toHaveBeenCalledWith({
        title: "Holiday",
        src: "https://youtube.com/watch?v=abc",
      }),
    );
  });

  it("doesn't save a word as a Project's new video", () => {
    update({ src: "holiday" });

    expect(mocks.addAlert).toHaveBeenCalledWith(notALink);
    expect(mocks.projects.updateProject).not.toHaveBeenCalled();
  });

  it("still renames a Project already saved with a word", () => {
    mocks.projects.project = { ...project, src: "holiday" };

    update({ title: "Final cut" });

    expect(mocks.projects.updateProject).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Final cut", src: "holiday" }),
    );
  });

  it("still lets a Project's video be cleared", () => {
    update({ src: "" });

    expect(mocks.projects.updateProject).toHaveBeenCalledWith(expect.objectContaining({ src: "" }));
  });
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

  it("CurrentProjectModal offers a local video for a project with no src", () => {
    const { src: _src, ...noSrc } = project;
    mocks.projects.project = noSrc;

    const { container } = render(<CurrentProjectModal toggle={vi.fn()} motionKey="current" />);

    expect(input(container, "title").value).toBe("Rough cut");
    expect(input(container, "src").value).toBe("");
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
  const submit = (label: "Share" | "Update") =>
    fireEvent.click(screen.getByRole("button", { name: label }));
  const sent = () => mocks.projects.shareProject.mock.calls[0][0];

  beforeEach(() => {
    mocks.projects.shareProject = vi.fn().mockResolvedValue(false);
  });

  it("keeps the url when the password is typed after it", () => {
    mocks.projects.project = { ...project, share: undefined };
    const container = renderShare();

    type(container, "url", "Final Cut");
    type(container, "password", "hunter2");

    expect(input(container, "url").value).toBe("final-cut");
    submit("Share");
    expect(sent()).toEqual({ url: "final-cut", canEdit: true, password: "hunter2" });
  });

  it("turns every run of whitespace into a dash and drops url-unsafe characters", () => {
    mocks.projects.project = { ...project, share: undefined };
    const container = renderShare();

    type(container, "url", "My  Final\tCut?#/%");

    expect(input(container, "url").value).toBe("my-final-cut");
  });

  it("gives two spaces typed one at a time a single dash", () => {
    mocks.projects.project = { ...project, share: undefined };
    const container = renderShare();

    type(container, "url", "rough ");
    type(container, "url", `${input(container, "url").value} `);

    expect(input(container, "url").value).toBe("rough-");
  });

  it("links to a Share stored with a space through its encoded url", () => {
    mocks.projects.project = { ...project, share: { ...project.share, url: "rough cut" } };
    renderShare();

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://videonote.app/vn/rough%20cut",
    );
  });

  it("keeps the url when edit access is toggled", () => {
    mocks.projects.project = { ...project, share: undefined };
    const container = renderShare();

    type(container, "url", "final");
    fireEvent.click(screen.getByText("Users can edit notes."));

    expect(input(container, "url").value).toBe("final");
  });

  const protectedShare = { ...project.share, hasPassword: true };

  it("never shows the stored password and keeps it when the field is left empty", () => {
    mocks.projects.project = { ...project, share: protectedShare };
    const container = renderShare();

    expect(input(container, "password").value).toBe("");
    submit("Update");
    expect(sent()).toEqual({ url: "rough-cut", canEdit: true });
  });

  it("sets a typed password on a protected Share", () => {
    mocks.projects.project = { ...project, share: protectedShare };
    const container = renderShare();

    type(container, "password", "swordfish");
    submit("Update");

    expect(sent()).toEqual({ url: "rough-cut", canEdit: true, password: "swordfish" });
  });

  it("removes the password only through the remove control", () => {
    mocks.projects.project = { ...project, share: protectedShare };
    renderShare();

    fireEvent.click(screen.getByText("Remove the password"));
    submit("Update");

    expect(sent()).toEqual({ url: "rough-cut", canEdit: true, password: "" });
  });

  it("offers no remove control when the Share has no password", () => {
    renderShare();

    expect(screen.queryByText("Remove the password")).not.toBeInTheDocument();
  });
});
