import type { NextPageContext } from "next";
import { afterEach, describe, expect, it, vi } from "vitest";

import IndexPage from "@/pages/index";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/router", () => ({ default: router }));

// Only getInitialProps is under test; the page's components are not rendered.
vi.mock("@/components/Layout/Layout", () => ({}));
vi.mock("@/components/Modals/Modals", () => ({}));
vi.mock("@/components/Notification/Notification", () => ({}));
vi.mock("@/components/Sidebar/Sidebar", () => ({}));
vi.mock("@/components/VideoPlayer/VideoPlayer", () => ({}));
vi.mock("@/context/appProviders", () => ({}));
vi.mock("@/context/controlsContext", () => ({}));
vi.mock("@/context/noteContext", () => ({}));
vi.mock("@/context/videoContext", () => ({}));
vi.mock("@/layout/AppContainer/AppContainer", () => ({}));
vi.mock("@/shared/Modal/Overlay", () => ({}));

const serverCtx = (cookie?: string) => {
  const res = { writeHead: vi.fn(), end: vi.fn() };
  const ctx = {
    req: { headers: { host: "videonote.test", ...(cookie && { cookie }) } },
    res,
  } as unknown as NextPageContext;
  return { ctx, res };
};

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
});

describe("IndexPage.getInitialProps on the server", () => {
  it("loads the account with the request's token and sets no cookie", async () => {
    const fetch = vi.fn(async () => Response.json({ user: { projects: [] }, token: "rotated" }));
    vi.stubGlobal("fetch", fetch);
    const { ctx } = serverCtx("token=abc");

    const props = await IndexPage.getInitialProps(ctx);

    expect(props).toEqual({ serverData: { user: { projects: [] }, token: "rotated" } });
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/api\/auth$/);
    expect(init.headers).toMatchObject({ Authorization: "Bearer abc" });
    expect(document.cookie).not.toContain("token=");
  });

  it("redirects to /hello without a token", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const { ctx, res } = serverCtx();

    await IndexPage.getInitialProps(ctx);

    expect(res.writeHead).toHaveBeenCalledWith(302, { Location: "/hello" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("redirects to /login when the token is rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ msg: "Invalid token" }, { status: 401 })),
    );
    const { ctx, res } = serverCtx("token=stale");

    await IndexPage.getInitialProps(ctx);

    expect(res.writeHead).toHaveBeenCalledWith(302, { Location: "/login" });
  });

  it("redirects with the router on a client-side navigation without a token", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    const props = await IndexPage.getInitialProps({} as NextPageContext);

    expect(router.replace).toHaveBeenCalledWith("/hello");
    expect(props).toEqual({});
    expect(fetch).not.toHaveBeenCalled();
  });
});
