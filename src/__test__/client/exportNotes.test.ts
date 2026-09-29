import { describe, expect, it } from "vitest";

import { createTxtFile } from "@/components/shared/ExportNotes/ExportNotes";
import type { ProjectInterface } from "@/components/shared/types";

describe("createTxtFile", () => {
  it("lists notes chronologically without reordering the project notes", () => {
    const project: ProjectInterface = {
      _id: "p1",
      title: "Project",
      user: "u1",
      notes: [
        { _id: "a", content: "later", time: 70, done: true },
        { _id: "b", content: "earlier", time: 5, done: false },
      ],
    };

    const lines = createTxtFile(project).split("\n");

    expect(lines.slice(-2)).toEqual(["  0:05 earlier", "✓ 1:10 later"]);
    expect(project.notes.map((n) => n._id)).toEqual(["a", "b"]);
  });
});
