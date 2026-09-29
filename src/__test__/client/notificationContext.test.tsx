import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationProvider, useNotificationContext } from "@/context/notificationContext";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NotificationProvider>{children}</NotificationProvider>
);

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("notificationContext", () => {
  it("expires an alert after its duration", () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper });
    act(() => {
      result.current.addAlert({ msg: "Saved", duration: 100 });
    });
    expect(result.current.alerts).toHaveLength(1);

    act(() => vi.advanceTimersByTime(100));

    expect(result.current.alerts).toHaveLength(0);
  });

  it("leaves no expiry pending after unmount", () => {
    const { result, unmount } = renderHook(() => useNotificationContext(), { wrapper });
    act(() => {
      result.current.addAlert({ msg: "First" });
    });
    act(() => {
      result.current.addAlert({ msg: "Second" });
    });

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
