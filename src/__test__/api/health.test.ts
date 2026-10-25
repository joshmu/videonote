import * as Sentry from "@sentry/nextjs";
import { StatusCodes } from "http-status-codes";
import { afterEach, describe, expect, it, vi } from "vitest";

import handler from "@/api/health";
import { setStoreForTests, type Store } from "@/utils/store";

import { BACKENDS, useTestStore } from "../db/testStores";
import { callApi } from "./http";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  flush: vi.fn(async () => true),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe.each(BACKENDS)("/api/health: %s", (backend) => {
  const store = useTestStore(backend);

  it("answers 200 and is never cached when the Store answers", async () => {
    const { status, body, headers } = await callApi(handler, undefined);

    expect(status).toBe(StatusCodes.OK);
    expect(body).toEqual({ status: "ok" });
    expect(headers["cache-control"]).toBe("no-store");
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("answers 503 and reports the error to Sentry when the Store fails", async () => {
    const failure = new Error("table unreachable");
    vi.spyOn(console, "error").mockImplementation(() => {});
    setStoreForTests({
      ...store(),
      getUser: async () => {
        throw failure;
      },
    } as Store);

    const { status, body } = await callApi(handler, undefined);

    expect(status).toBe(StatusCodes.SERVICE_UNAVAILABLE);
    expect(body).toEqual({ status: "error" });
    expect(Sentry.captureException).toHaveBeenCalledWith(failure);
    expect(Sentry.flush).toHaveBeenCalled();
  });
});
