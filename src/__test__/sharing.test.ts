import { describe, expect, it } from "vitest";

// Bugs 1 & 2 (share actions sent in lowercase) are covered by behaviour tests
// in `client/projectsContext.test.tsx`, which assert the request body.

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

// Bug 4 (server-side password null guard) is now covered by behavior tests in
// `share/shareIntake.test.ts` — the SHARE action no longer hand-rolls the
// guard inside `pages/api/project.ts`. Password handling is owned by
// `hashSharePassword`, which accepts `null | undefined | ""` by contract.
