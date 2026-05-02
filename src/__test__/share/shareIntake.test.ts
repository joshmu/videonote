import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/utils/mongoose", () => ({
  Share: {
    findByIdAndUpdate: vi.fn(),
    create: vi.fn(),
    deleteOne: vi.fn(),
  },
  Project: {
    findOne: vi.fn(),
  },
}));

import { Project, Share } from "@/utils/mongoose";
import { attachOrUpdateShare, detachShare, ShareUrlTakenError } from "@/utils/share/shareIntake";
import { verifySharePassword } from "@/utils/share/sharePassword";

type FakeProjectDoc = {
  _id: string;
  user: string;
  share: string | null;
  save: ReturnType<typeof vi.fn>;
};

const buildProjectDoc = (overrides: Partial<FakeProjectDoc> = {}): FakeProjectDoc => ({
  _id: "p1",
  user: "u1",
  share: null,
  save: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

// Whatever the populated lookup returns is what the intake module should hand back.
const populatedProject = { _id: "p1", share: { _id: "s1" }, populated: true };

const mockPopulatedLookup = () => {
  vi.mocked(Project.findOne).mockReturnValue({
    populate: vi.fn().mockResolvedValue(populatedProject),
  } as never);
};

beforeEach(() => {
  mockPopulatedLookup();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("attachOrUpdateShare — create path (no existing share)", () => {
  it("creates a new Share linked to the project and user, sets projectDoc.share, and returns the populated project", async () => {
    const projectDoc = buildProjectDoc();
    vi.mocked(Share.create).mockResolvedValue({ _id: "s-new" } as never);

    const result = await attachOrUpdateShare(projectDoc as never, {
      url: "myshare",
      canEdit: true,
    });

    expect(Share.create).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "myshare",
        canEdit: true,
        project: "p1",
        user: "u1",
      }),
    );
    expect(projectDoc.share).toBe("s-new");
    expect(projectDoc.save).toHaveBeenCalledTimes(1);
    expect(result).toBe(populatedProject);
  });

  it("hashes a supplied password before persisting it", async () => {
    const projectDoc = buildProjectDoc();
    let persistedPassword: string | null | undefined;
    vi.mocked(Share.create).mockImplementation(async (doc: unknown) => {
      persistedPassword = (doc as { password?: string | null }).password;
      return { _id: "s-new" } as never;
    });

    await attachOrUpdateShare(projectDoc as never, {
      url: "myshare",
      canEdit: true,
      password: "hunter2",
    });

    expect(persistedPassword).toBeTruthy();
    expect(persistedPassword).not.toBe("hunter2");
    expect(await verifySharePassword(persistedPassword, "hunter2")).toEqual({ kind: "ok" });
  });

  it("surfaces a duplicate url as ShareUrlTakenError, leaving the project's share ref unchanged", async () => {
    const projectDoc = buildProjectDoc();
    const dupKey = Object.assign(new Error("E11000 duplicate key"), { code: 11000 });
    vi.mocked(Share.create).mockRejectedValue(dupKey as never);

    await expect(
      attachOrUpdateShare(projectDoc as never, { url: "taken", canEdit: true }),
    ).rejects.toBeInstanceOf(ShareUrlTakenError);

    expect(projectDoc.share).toBeNull();
    expect(projectDoc.save).not.toHaveBeenCalled();
  });

  it("does not include a password field when none was supplied (defers to schema default, no crash)", async () => {
    const projectDoc = buildProjectDoc();
    let createdDoc: Record<string, unknown> | undefined;
    vi.mocked(Share.create).mockImplementation(async (doc: unknown) => {
      createdDoc = doc as Record<string, unknown>;
      return { _id: "s-new" } as never;
    });

    await attachOrUpdateShare(projectDoc as never, {
      url: "myshare",
      canEdit: true,
    });

    expect(createdDoc).toBeDefined();
    expect("password" in createdDoc!).toBe(false);
  });

  it("persists an empty password as undefined (no protection)", async () => {
    const projectDoc = buildProjectDoc();
    let persistedPassword: string | null | undefined = "sentinel";
    vi.mocked(Share.create).mockImplementation(async (doc: unknown) => {
      persistedPassword = (doc as { password?: string | null }).password;
      return { _id: "s-new" } as never;
    });

    await attachOrUpdateShare(projectDoc as never, {
      url: "myshare",
      canEdit: true,
      password: "",
    });

    expect(persistedPassword).toBeUndefined();
  });
});

describe("attachOrUpdateShare — update path (existing share)", () => {
  it("updates the existing share via findByIdAndUpdate and never creates a new one", async () => {
    const projectDoc = buildProjectDoc({ share: "s-existing" });
    vi.mocked(Share.findByIdAndUpdate).mockResolvedValue({ _id: "s-existing" } as never);

    await attachOrUpdateShare(projectDoc as never, {
      url: "new-url",
      canEdit: false,
    });

    expect(Share.create).not.toHaveBeenCalled();
    expect(Share.findByIdAndUpdate).toHaveBeenCalledWith("s-existing", {
      $set: expect.objectContaining({ url: "new-url", canEdit: false }),
    });
  });

  it("hashes a supplied password before persisting it on the existing share", async () => {
    const projectDoc = buildProjectDoc({ share: "s-existing" });
    vi.mocked(Share.findByIdAndUpdate).mockResolvedValue({ _id: "s-existing" } as never);

    await attachOrUpdateShare(projectDoc as never, {
      url: "new-url",
      canEdit: false,
      password: "rotated",
    });

    const [, update] = vi.mocked(Share.findByIdAndUpdate).mock.calls[0];
    const persistedPassword = (update as { $set: { password?: string } }).$set.password;
    expect(persistedPassword).toBeTruthy();
    expect(persistedPassword).not.toBe("rotated");
    expect(await verifySharePassword(persistedPassword, "rotated")).toEqual({ kind: "ok" });
  });

  it("does not touch the password field when the update payload omits it", async () => {
    const projectDoc = buildProjectDoc({ share: "s-existing" });
    vi.mocked(Share.findByIdAndUpdate).mockResolvedValue({ _id: "s-existing" } as never);

    await attachOrUpdateShare(projectDoc as never, {
      url: "new-url",
      canEdit: false,
    });

    const [, update] = vi.mocked(Share.findByIdAndUpdate).mock.calls[0];
    const set = (update as { $set: Record<string, unknown> }).$set;
    expect("password" in set).toBe(false);
  });
});

describe("detachShare", () => {
  it("deletes the share scoped by share/project/user, clears projectDoc.share, and returns the populated project", async () => {
    const projectDoc = buildProjectDoc({ share: "s-existing" });
    vi.mocked(Share.deleteOne).mockResolvedValue({ deletedCount: 1 } as never);

    const result = await detachShare(projectDoc as never, { _id: "s-existing" });

    expect(Share.deleteOne).toHaveBeenCalledWith({
      _id: "s-existing",
      project: "p1",
      user: "u1",
    });
    expect(projectDoc.share).toBeNull();
    expect(projectDoc.save).toHaveBeenCalledTimes(1);
    expect(result).toBe(populatedProject);
  });
});
