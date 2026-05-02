import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/utils/mongoose", () => ({
  Project: { findOne: vi.fn() },
}));

import { Project } from "@/utils/mongoose";
import { findProjectWithRelations } from "@/utils/project/findProjectWithRelations";

afterEach(() => {
  vi.clearAllMocks();
});

describe("findProjectWithRelations", () => {
  it("hydrates a project with its notes (including each note's author) and its share", async () => {
    const populated = { _id: "p1", notes: [], share: { url: "x" } };
    const populateSpy = vi.fn().mockResolvedValue(populated);
    vi.mocked(Project.findOne).mockReturnValue({ populate: populateSpy } as never);

    const result = await findProjectWithRelations({ _id: "p1" });

    expect(Project.findOne).toHaveBeenCalledWith({ _id: "p1" });
    expect(populateSpy).toHaveBeenCalledWith([
      {
        path: "notes",
        model: "Note",
        populate: { path: "user", model: "User", select: "username email" },
      },
      { path: "share", model: "Share" },
    ]);
    expect(result).toBe(populated);
  });
});
