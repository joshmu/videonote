import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GlobalProvider, useGlobalContext } from "@/context/globalContext";

vi.mock("@/context/notificationContext", () => ({
  useNotificationContext: () => ({ addAlert: vi.fn() }),
}));
vi.mock("next/router", () => ({ default: { push: vi.fn() } }));
vi.mock("@/utils/clientHelpers", () => ({ fetcher: vi.fn() }));

let ctx: ReturnType<typeof useGlobalContext>;
const Probe = () => {
  ctx = useGlobalContext();
  return null;
};

const renderGlobal = () =>
  render(
    <GlobalProvider serverData={{ user: { projects: [] } }}>
      <Probe />
    </GlobalProvider>,
  );

describe("globalContext toggles", () => {
  it("toggleMenuOpen(false) keeps a closed menu closed", () => {
    renderGlobal();
    expect(ctx.menuOpen).toBe(false);

    act(() => ctx.toggleMenuOpen(false));

    expect(ctx.menuOpen).toBe(false);
  });

  it("toggleMenuOpen() without a state still toggles", () => {
    renderGlobal();

    act(() => ctx.toggleMenuOpen());

    expect(ctx.menuOpen).toBe(true);
  });

  it("toggleSidebar(true) keeps an open sidebar open and toggleSidebar(false) closes it", () => {
    renderGlobal();
    expect(ctx.sidebarOpen).toBe(true);

    act(() => ctx.toggleSidebar(true));
    expect(ctx.sidebarOpen).toBe(true);

    act(() => ctx.toggleSidebar(false));
    expect(ctx.sidebarOpen).toBe(false);

    act(() => ctx.toggleSidebar(false));
    expect(ctx.sidebarOpen).toBe(false);
  });
});
