import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useNoteProximity } from "@/hooks/useNoteProximity";

const earlier = { _id: "earlier", content: "earlier", time: 10 };
const later = { _id: "later", content: "later", time: 20 };

describe("useNoteProximity", () => {
  it.each([
    ["time order", [earlier, later]],
    ["reverse time order", [later, earlier]],
  ])("breaks an equal-distance tie by time regardless of %s", (_label, notes) => {
    const { result } = renderHook(() =>
      useNoteProximity({ notes, progress: { playedSeconds: 15 } }),
    );

    expect(result.current.currentNote?._id).toBe("later");
  });

  it("does not reorder the notes it is given", () => {
    const notes = [later, earlier];

    renderHook(() => useNoteProximity({ notes, progress: { playedSeconds: 15 } }));

    expect(notes.map((n) => n._id)).toEqual(["later", "earlier"]);
  });
});
