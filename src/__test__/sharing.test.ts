import { describe, expect, it, vi } from "vitest";

import { ProjectApiActions } from "@/root/src/components/shared/types";

// ============================================================
// Bug 1 & 2: Action string mismatch
// The client sends lowercase action strings ("share", "remove share")
// but the server expects uppercase enum values ("SHARE", "REMOVE SHARE")
// ============================================================

// Mock fetcher to capture the body passed to it
const mockFetcher = vi.fn().mockResolvedValue({
  res: { status: 200 },
  data: {
    project: {
      _id: "proj1",
      share: { _id: "share1", url: "test-url", canEdit: true },
    },
  },
});

vi.mock("@/utils/clientHelpers", () => ({
  fetcher: (...args: unknown[]) => mockFetcher(...args),
}));

// Mock notification context
vi.mock("@/context/notificationContext", () => ({
  useNotificationContext: () => ({ addAlert: vi.fn() }),
}));

// Mock next/router
vi.mock("next/router", () => ({
  default: { push: vi.fn() },
}));

// Mock universal-cookie
vi.mock("universal-cookie", () => ({
  default: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  })),
}));

// Mock usePrompt hook
vi.mock("@/hooks/usePrompt", () => ({
  usePrompt: () => ({
    promptState: { isOpen: false },
    createPrompt: vi.fn(),
    confirmPrompt: vi.fn(),
    cancelPrompt: vi.fn(),
  }),
}));

describe("Bug 1: shareProject sends correct action string", () => {
  it("should send ProjectApiActions.SHARE ('SHARE') not lowercase 'share'", async () => {
    // We test by checking the action string constant directly matches what the
    // shareProject function constructs in the request body.
    // The shareProject function in globalContext.tsx line 204 builds:
    //   { action: "share", ... }
    // It should be:
    //   { action: ProjectApiActions.SHARE, ... }  which equals "SHARE"

    // Import the module to get at the shareProject implementation
    // Since shareProject is inside a React context provider, we test the action
    // string value directly
    const expectedAction = ProjectApiActions.SHARE;
    expect(expectedAction).toBe("SHARE");

    // Read the source file and verify the action string used
    const fs = await import("fs");
    const source = fs.readFileSync("src/context/globalContext.tsx", "utf-8");

    // Find the shareProject function body - it should use ProjectApiActions.SHARE
    // not a hardcoded lowercase string
    const shareProjectMatch = source.match(
      /const shareProject[\s\S]*?const body = \{[\s\S]*?action:\s*(.+?),/,
    );
    expect(shareProjectMatch).toBeTruthy();
    const actionValue = shareProjectMatch![1].trim();

    // The action should reference the enum, not a hardcoded lowercase string
    expect(actionValue).not.toBe('"share"');
    expect(actionValue).toBe("ProjectApiActions.SHARE");
  });
});

describe("Bug 2: removeShareProject sends correct action string", () => {
  it("should send ProjectApiActions.REMOVE_SHARE ('REMOVE SHARE') not lowercase 'remove share'", async () => {
    const expectedAction = ProjectApiActions.REMOVE_SHARE;
    expect(expectedAction).toBe("REMOVE SHARE");

    const fs = await import("fs");
    const source = fs.readFileSync("src/context/globalContext.tsx", "utf-8");

    // Find the removeShareProject function body
    const removeShareMatch = source.match(
      /const removeShareProject[\s\S]*?const body = \{[\s\S]*?action:\s*(.+?),/,
    );
    expect(removeShareMatch).toBeTruthy();
    const actionValue = removeShareMatch![1].trim();

    expect(actionValue).not.toBe('"remove share"');
    expect(actionValue).toBe("ProjectApiActions.REMOVE_SHARE");
  });
});

// ============================================================
// Bug 3: ShareProjectModal passes `state` instead of `shareData`
// The handleSubmit creates shareData with password deduplication
// but then passes `state` (raw) to shareProject()
// ============================================================

describe("Bug 3: ShareProjectModal passes shareData to shareProject", () => {
  it("should pass shareData (with password deduplication) not raw state", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(
      "src/components/Modals/ShareProjectModal/ShareProjectModal.tsx",
      "utf-8",
    );

    // Find the handleSubmit function and check what's passed to shareProject()
    const shareProjectCallMatch = source.match(/await shareProject\((\w+)\)/);
    expect(shareProjectCallMatch).toBeTruthy();
    const argName = shareProjectCallMatch![1];

    // It should pass shareData (which has password deduplication applied)
    // not state (which has the raw/hashed password)
    expect(argName).not.toBe("state");
    expect(argName).toBe("shareData");
  });
});

// ============================================================
// Bug 4: Server crashes when password field is undefined
// pages/api/project.ts does shareData.password.length without null guard
// ============================================================

describe("Bug 4: Server-side password null guard", () => {
  it("should use optional chaining for shareData.password access", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync("pages/api/project.ts", "utf-8");

    // Find all occurrences of password length check in the SHARE action
    const passwordChecks = source.match(/shareData\.password(\??)\.\s*length/g);
    expect(passwordChecks).toBeTruthy();
    expect(passwordChecks!.length).toBeGreaterThanOrEqual(2);

    // Every occurrence should use optional chaining
    for (const check of passwordChecks!) {
      expect(check).toContain("?.");
    }
  });
});
