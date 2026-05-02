import { describe, expect, it } from "vitest";

import { hashSharePassword, verifySharePassword } from "@/utils/share/sharePassword";

describe("verifySharePassword", () => {
  it("treats a null stored hash as open access", async () => {
    const result = await verifySharePassword(null, "anything");
    expect(result).toEqual({ kind: "open" });
  });

  it("treats an empty stored hash as open access", async () => {
    const result = await verifySharePassword("", "anything");
    expect(result).toEqual({ kind: "open" });
  });

  it("treats an undefined stored hash as open access", async () => {
    const result = await verifySharePassword(undefined, undefined);
    expect(result).toEqual({ kind: "open" });
  });

  it("requires a password when one is stored but none is supplied", async () => {
    const stored = await hashSharePassword("secret");
    const result = await verifySharePassword(stored, undefined);
    expect(result).toEqual({ kind: "passwordRequired" });
  });

  it("rejects an incorrect password against the stored hash", async () => {
    const stored = await hashSharePassword("secret");
    const result = await verifySharePassword(stored, "wrong");
    expect(result).toEqual({ kind: "incorrect" });
  });

  it("accepts the correct password against the stored hash", async () => {
    const stored = await hashSharePassword("secret");
    const result = await verifySharePassword(stored, "secret");
    expect(result).toEqual({ kind: "ok" });
  });
});

describe("hashSharePassword", () => {
  it("returns null for an empty plaintext (no password protection)", async () => {
    expect(await hashSharePassword("")).toBeNull();
  });

  it("returns null for a null plaintext", async () => {
    expect(await hashSharePassword(null)).toBeNull();
  });

  it("returns a bcrypt hash that round-trips through verifySharePassword", async () => {
    const hash = await hashSharePassword("hunter2");
    expect(hash).not.toBeNull();
    expect(hash).not.toBe("hunter2");
    expect(await verifySharePassword(hash, "hunter2")).toEqual({ kind: "ok" });
  });
});
