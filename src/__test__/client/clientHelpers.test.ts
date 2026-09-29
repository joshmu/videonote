import { describe, expect, it, vi } from "vitest";

import { checkPassword, checkUsername, isValidCredentials } from "@/utils/clientHelpers";

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
