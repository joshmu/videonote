import { describe, expect, it, vi } from "vitest";

import {
  checkPassword,
  checkUsername,
  createObjectId,
  isValidCredentials,
} from "@/utils/clientHelpers";

const alertsFor = (input: { email: string; username?: string; password?: string }): string[] => {
  const addAlert = vi.fn();
  isValidCredentials({ ...input, addAlert });
  return addAlert.mock.calls.map(([alert]) => alert.msg);
};

const statedMinimum = (msg: string): number => Number(msg.match(/at least (\d+)/)?.[1]);

describe("isValidCredentials messages", () => {
  it("states the username minimum the rule enforces", () => {
    const msg = alertsFor({ email: "a@b.co", username: "ab", password: "secret" }).find((m) =>
      /username/i.test(m),
    );
    const min = statedMinimum(msg);

    expect(checkUsername("x".repeat(min))).toBe(true);
    expect(checkUsername("x".repeat(min - 1))).toBe(false);
  });

  it("states the password minimum the rule enforces", () => {
    const msg = alertsFor({ email: "a@b.co", username: "valid-name", password: "ab" }).find((m) =>
      /password/i.test(m),
    );
    const min = statedMinimum(msg);

    expect(checkPassword("x".repeat(min))).toBe(true);
    expect(checkPassword("x".repeat(min - 1))).toBe(false);
  });

  it("reports an invalid email", () => {
    expect(alertsFor({ email: "nope", username: "valid-name", password: "secret" })).toEqual([
      "Email is invalid.",
    ]);
  });
});

describe("createObjectId", () => {
  it("returns 24 hex characters led by the current time in seconds", () => {
    const before = Math.floor(Date.now() / 1000);
    const id = createObjectId();
    const after = Math.floor(Date.now() / 1000);

    expect(id).toMatch(/^[0-9a-f]{24}$/);
    const seconds = parseInt(id.slice(0, 8), 16);
    expect(seconds).toBeGreaterThanOrEqual(before);
    expect(seconds).toBeLessThanOrEqual(after);
  });

  it("returns a different id on each call", () => {
    expect(createObjectId()).not.toBe(createObjectId());
  });
});
