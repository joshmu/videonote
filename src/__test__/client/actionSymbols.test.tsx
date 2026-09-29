import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ActionSymbols from "@/components/ActionInput/ActionSymbols/ActionSymbols";
import { PlayerAction } from "@/context/videoContext";

const mocks = vi.hoisted(() => ({ action: "" as string }));

vi.mock("@/context/videoContext", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useVideoContext: () => ({ action: mocks.action }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  mocks.action = "";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ActionSymbols", () => {
  it("shows a player action for a second", () => {
    const { container, rerender } = render(<ActionSymbols />);

    mocks.action = PlayerAction.PLAY;
    rerender(<ActionSymbols />);
    expect(container.querySelector("svg")).not.toBeNull();

    act(() => vi.advanceTimersByTime(1000));
    expect(container.querySelector("svg")).toBeNull();
  });

  it("leaves no hide pending after unmount", () => {
    const { rerender, unmount } = render(<ActionSymbols />);
    mocks.action = PlayerAction.PLAY;
    rerender(<ActionSymbols />);
    mocks.action = PlayerAction.PAUSE;
    rerender(<ActionSymbols />);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
