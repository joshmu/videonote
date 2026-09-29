import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePrompt } from "@/hooks/usePrompt";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("usePrompt", () => {
  it("resets a closed prompt after its animation", () => {
    const { result } = renderHook(() => usePrompt());
    act(() => result.current.createPrompt({ msg: "First?", action: () => {} }));

    act(() => result.current.cancelPrompt());
    act(() => vi.advanceTimersByTime(300));

    expect(result.current.promptState.msg).toBe("Are you sure?");
  });

  it("keeps a prompt opened while the previous one is still resetting", () => {
    const { result } = renderHook(() => usePrompt());
    act(() => result.current.createPrompt({ msg: "First?", action: () => {} }));
    act(() => result.current.confirmPrompt({}));

    act(() => result.current.createPrompt({ msg: "Second?", action: () => {} }));
    act(() => vi.advanceTimersByTime(300));

    expect(result.current.promptState.isOpen).toBe(true);
    expect(result.current.promptState.msg).toBe("Second?");
  });

  it("leaves no reset pending after unmount", () => {
    const { result, unmount } = renderHook(() => usePrompt());
    act(() => result.current.createPrompt({ msg: "First?", action: () => {} }));
    act(() => result.current.cancelPrompt());

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
