import type { NextPageContext } from "next";
import { afterEach, describe, expect, it, vi } from "vitest";

import ShareProjectPage from "@/pages/vn/[id]";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/router", () => ({ default: router }));

// Only getInitialProps is under test; the page's components are not rendered.
vi.mock("@/components/Layout/Layout", () => ({}));
vi.mock("@/components/Modals/Modals", () => ({}));
vi.mock("@/components/Notification/Notification", () => ({}));
vi.mock("@/components/Sidebar/Sidebar", () => ({}));
vi.mock("@/components/VideoPlayer/VideoPlayer", () => ({}));
vi.mock("@/context/controlsContext", () => ({}));
vi.mock("@/context/globalContext", () => ({}));
vi.mock("@/context/noteContext", () => ({}));
vi.mock("@/context/videoContext", () => ({}));
vi.mock("@/layout/AppContainer/AppContainer", () => ({}));
vi.mock("@/shared/Modal/Overlay", () => ({}));

const project = { _id: "p1", title: "Rough cut", notes: [] };

const loadShare = async (status: number, body: unknown) => {
  const fetch = vi.fn(async () => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetch);
  const res = { writeHead: vi.fn(), end: vi.fn() };
  const ctx = {
    query: { id: "rough-cut" },
    req: { headers: { host: "videonote.test" } },
    res,
  } as unknown as NextPageContext;
  const props = await ShareProjectPage.getInitialProps(ctx);
  return { props, res, fetch };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ShareProjectPage.getInitialProps", () => {
  it("passes an open Share's project to the page", async () => {
    const { props, res, fetch } = await loadShare(200, { user: { projects: [project] } });

    expect(props).toEqual({ serverData: { share: { kind: "ok", project } } });
    expect(res.writeHead).not.toHaveBeenCalled();
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/api\/public_project$/);
    expect(JSON.parse(init.body as string)).toEqual({ shareUrl: "rough-cut" });
  });

  it("stays on a password-protected Share so the page can prompt", async () => {
    const { props, res } = await loadShare(401, { msg: "shared project password required" });

    expect(props).toEqual({ serverData: { share: { kind: "passwordRequired" } } });
    expect(res.writeHead).not.toHaveBeenCalled();
  });

  it.each([
    [404, { msg: "Share url does not exist." }],
    [500, { msg: "Database error" }],
  ])("redirects to /hello on a %i reply", async (status, body) => {
    const { res } = await loadShare(status, body);

    expect(res.writeHead).toHaveBeenCalledWith(302, { Location: "/hello" });
  });

  it("redirects with the router on a client-side navigation to a missing Share", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ msg: "Share url does not exist." }, { status: 404 })),
    );

    const props = await ShareProjectPage.getInitialProps({
      query: { id: "gone" },
    } as unknown as NextPageContext);

    expect(router.replace).toHaveBeenCalledWith("/hello");
    expect(props).toEqual({});
  });
});
