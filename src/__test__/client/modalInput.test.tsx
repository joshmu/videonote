import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ModalInput } from "@/shared/Modal/ModalInput";

describe("ModalInput", () => {
  it("keeps a slider inside its range", () => {
    const { container } = render(
      <ModalInput id="volume" type="range" value={0.5} min={0} max={1} step={0.05} readOnly />,
    );

    const slider = container.querySelector("input");
    expect(slider).toHaveAttribute("max", "1");
    expect(slider).toHaveAttribute("step", "0.05");
  });
});
