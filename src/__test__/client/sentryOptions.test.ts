import { describe, expect, it } from "vitest";

import { sentryOptions } from "@/root/sentry.options";

describe("sentryOptions.beforeBreadcrumb", () => {
  it("drops console output, which can hold Notes and video URLs", () => {
    const breadcrumb = { category: "console", level: "log" as const, message: "update the note" };

    expect(sentryOptions.beforeBreadcrumb(breadcrumb)).toBeNull();
  });

  it("keeps the other breadcrumbs", () => {
    const breadcrumb = { category: "navigation", data: { from: "/login", to: "/" } };

    expect(sentryOptions.beforeBreadcrumb(breadcrumb)).toBe(breadcrumb);
  });
});
