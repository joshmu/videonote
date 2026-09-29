import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DisplayUser from "@/components/NoteList/NoteItem/DisplayUser/DisplayUser";

describe("DisplayUser", () => {
  it("renders nothing for the current user's own note", () => {
    const { container } = render(
      <DisplayUser noteUser={{ _id: "u1" }} currentUser={{ _id: "u1" }} />,
    );

    expect(container.textContent).toBe("");
  });

  it("labels an id-only author as guest", () => {
    const { container } = render(<DisplayUser noteUser={{ _id: "u2" }} currentUser={null} />);

    expect(container.textContent).toBe("guest");
  });

  it("shows another author's username", () => {
    const { container } = render(
      <DisplayUser noteUser={{ _id: "u2", username: "Casey" }} currentUser={{ _id: "u1" }} />,
    );

    expect(container.textContent).toBe("casey");
  });
});
