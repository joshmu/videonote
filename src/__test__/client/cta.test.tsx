import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CTA } from "@/components/HelloPage/CTA/CTA";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/router", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("react-scroll", () => ({ animateScroll: { scrollToTop: vi.fn() } }));

beforeEach(() => {
  vi.useFakeTimers();
  mocks.push.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CTA", () => {
  it("goes to login once the scroll to top has finished", () => {
    render(<CTA />);
    fireEvent.click(screen.getByRole("button"));
    expect(mocks.push).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(600));

    expect(mocks.push).toHaveBeenCalledWith("/login");
  });

  it("does not navigate after unmount", () => {
    const { unmount } = render(<CTA />);
    fireEvent.click(screen.getByRole("button"));

    unmount();
    vi.advanceTimersByTime(600);

    expect(mocks.push).not.toHaveBeenCalled();
  });
});
