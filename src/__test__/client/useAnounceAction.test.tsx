import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PlayerAction } from "@/context/videoContext";
import { useAnounceAction } from "@/hooks/useAnounceAction";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useAnounceAction", () => {
  it("announces an action and then resets it", () => {
    const { result } = renderHook(() => useAnounceAction(""));

    act(() => result.current[1](PlayerAction.PLAY));
    expect(result.current[0]).toBe(PlayerAction.PLAY);

    act(() => vi.advanceTimersByTime(10));
    expect(result.current[0]).toBe("");
  });

  it("leaves no reset pending after unmount", () => {
    const { result, unmount } = renderHook(() => useAnounceAction(""));
    act(() => result.current[1](PlayerAction.PLAY));

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps one reset pending when the action changes before it fires", () => {
    const { result } = renderHook(() => useAnounceAction(""));
    act(() => result.current[1](PlayerAction.PLAY));
    act(() => result.current[1](PlayerAction.PAUSE));

    expect(vi.getTimerCount()).toBe(1);
  });
});
