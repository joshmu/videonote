import { expect, test } from "@playwright/test";

import { ORIGIN } from "../support/api";

test.describe("health", () => {
  test("The health check answers ok from the real table and is never cached", async () => {
    const response = await fetch(`${ORIGIN}/api/health`);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
