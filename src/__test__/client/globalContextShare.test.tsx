import { act, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProjectApiActions } from "@/components/shared/types";
import { AppProviders } from "@/context/appProviders";
import { useGlobalContext } from "@/context/globalContext";
import { useSessionContext } from "@/context/sessionContext";
import { useUiShellContext } from "@/context/uiShellContext";

vi.mock("@/context/notificationContext", () => ({
  useNotificationContext: () => ({ addAlert: vi.fn() }),
}));
vi.mock("next/router", () => ({ default: { push: vi.fn() } }));

const project = { _id: "p1", title: "Rough cut", src: "v.mp4", user: "u1", notes: [] };
const share = { _id: "s1", url: "rough-cut", canEdit: true };

let ctx: ReturnType<typeof useGlobalContext> &
  ReturnType<typeof useSessionContext> &
  ReturnType<typeof useUiShellContext>;
const Probe = () => {
  ctx = { ...useGlobalContext(), ...useSessionContext(), ...useUiShellContext() };
  return null;
};

const bodies: Record<string, any>[] = [];
const stubFetch = () =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      bodies.push(body);
      if (url === "/api/settings") return Response.json({ settings: body.settings });
      const shared = body.action === ProjectApiActions.SHARE;
      return Response.json({ project: { ...project, share: shared ? share : undefined } });
    }),
  );

const renderSignedIn = async () => {
  await act(async () => {
    render(
      <AppProviders
        serverData={{
          user: {
            _id: "u1",
            username: "owner",
            settings: { currentProject: "p1" },
            projects: [project],
          },
        }}
      >
        <Probe />
      </AppProviders>,
    );
  });
  await waitFor(() => expect(ctx.project?._id).toBe("p1"));
};

afterEach(() => {
  bodies.length = 0;
  vi.unstubAllGlobals();
});

describe("globalContext sharing", () => {
  it("shareProject sends the SHARE action and reports whether the share matches", async () => {
    stubFetch();
    await renderSignedIn();

    let matched: boolean;
    await act(async () => {
      matched = await ctx.shareProject({ url: "rough-cut", canEdit: true });
    });

    expect(bodies.at(-1)).toMatchObject({
      action: "SHARE",
      project: { _id: "p1" },
      share: { url: "rough-cut", canEdit: true },
    });
    expect(matched).toBe(true);
    expect(ctx.project.share).toEqual(share);
  });

  it("removeShareProject sends the REMOVE SHARE action with the share id", async () => {
    stubFetch();
    await renderSignedIn();
    await act(async () => {
      await ctx.shareProject({ url: "rough-cut", canEdit: true });
    });

    let removed: boolean;
    await act(async () => {
      removed = await ctx.removeShareProject();
    });

    expect(bodies.at(-1)).toMatchObject({
      action: "REMOVE SHARE",
      project: { _id: "p1" },
      share: { _id: "s1" },
    });
    expect(removed).toBe(true);
    expect(ctx.project.share).toBeUndefined();
  });
});
