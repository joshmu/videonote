import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ModalType } from "@/components/Modals/Modals";
import { UiShellProvider, useUiShellContext } from "@/context/uiShellContext";

let ctx: ReturnType<typeof useUiShellContext>;
const Probe = () => {
  ctx = useUiShellContext();
  return <input ref={ctx.actionInputRef} data-testid="action-input" />;
};

const renderShell = () =>
  render(
    <UiShellProvider>
      <Probe />
    </UiShellProvider>,
  );

describe("uiShellContext toggles", () => {
  it("toggleMenuOpen(false) keeps a closed menu closed", () => {
    renderShell();
    expect(ctx.menuOpen).toBe(false);

    act(() => ctx.toggleMenuOpen(false));

    expect(ctx.menuOpen).toBe(false);
  });

  it("toggleMenuOpen() without a state still toggles", () => {
    renderShell();

    act(() => ctx.toggleMenuOpen());

    expect(ctx.menuOpen).toBe(true);
  });

  it("toggleSidebar(true) keeps an open sidebar open and toggleSidebar(false) closes it", () => {
    renderShell();
    expect(ctx.sidebarOpen).toBe(true);

    act(() => ctx.toggleSidebar(true));
    expect(ctx.sidebarOpen).toBe(true);

    act(() => ctx.toggleSidebar(false));
    expect(ctx.sidebarOpen).toBe(false);

    act(() => ctx.toggleSidebar(false));
    expect(ctx.sidebarOpen).toBe(false);
  });
});

describe("uiShellContext modals", () => {
  it("toggleModalOpen opens a modal, closes it again and closes all without a name", () => {
    renderShell();

    act(() => ctx.toggleModalOpen(ModalType.HELP));
    act(() => ctx.toggleModalOpen(ModalType.SETTINGS));
    expect(ctx.modalsOpen).toEqual([ModalType.HELP, ModalType.SETTINGS]);

    act(() => ctx.toggleModalOpen(ModalType.HELP));
    expect(ctx.modalsOpen).toEqual([ModalType.SETTINGS]);

    act(() => ctx.toggleModalOpen());
    expect(ctx.modalsOpen).toEqual([]);
  });

  it("cancelModals closes the modals, the prompt and the menu", () => {
    renderShell();
    act(() => {
      ctx.toggleModalOpen(ModalType.HELP);
      ctx.toggleMenuOpen(true);
      ctx.createPrompt({ msg: "Sure?", action: () => {} });
    });
    expect(ctx.promptState.isOpen).toBe(true);

    act(() => ctx.cancelModals());

    expect(ctx.modalsOpen).toEqual([]);
    expect(ctx.menuOpen).toBe(false);
    expect(ctx.promptState.isOpen).toBe(false);
  });
});

describe("uiShellContext action input", () => {
  it("actionInputFocus focuses the input holding actionInputRef", () => {
    const { getByTestId } = renderShell();

    act(() => ctx.actionInputFocus());

    expect(document.activeElement).toBe(getByTestId("action-input"));
  });

  it("actionInputFocus does nothing when no input is shown", () => {
    let shell: ReturnType<typeof useUiShellContext>;
    const NoInput = () => {
      shell = useUiShellContext();
      return null;
    };
    render(
      <UiShellProvider>
        <NoInput />
      </UiShellProvider>,
    );

    expect(() => act(() => shell.actionInputFocus())).not.toThrow();
  });
});
