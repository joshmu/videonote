import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DisplayUser from "@/components/NoteList/NoteItem/DisplayUser/DisplayUser";

const label = (props: Record<string, unknown>) => render(<DisplayUser {...props} />).container;

describe("DisplayUser", () => {
  it("renders nothing on the viewer's own note", () => {
    expect(label({ author: { _id: "u1", role: "owner" }, own: true }).textContent).toBe("");
  });

  it("labels an author without a public username by role", () => {
    expect(label({ author: { _id: "u1", role: "owner" } }).textContent).toBe("owner");
    expect(label({ author: { _id: "u2", role: "member" } }).textContent).toBe("member");
  });

  it("labels a note with no author as guest", () => {
    expect(label({}).textContent).toBe("guest");
  });

  it("shows an author's public username", () => {
    expect(label({ author: { _id: "u2", username: "Casey", role: "member" } }).textContent).toBe(
      "casey",
    );
  });
});
