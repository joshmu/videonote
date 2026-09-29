import { createHash, createHmac } from "node:crypto";

import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { describe, expect, it } from "vitest";

import { issueShareToken, verifyShareToken } from "@/utils/share/shareToken";

import { useTestJwtSecret } from "../api/http";

useTestJwtSecret();

const share = { _id: new Types.ObjectId(), password: "$2a$10$storedbcrypthash" };
const version = createHash("sha256").update(share.password).digest("hex");
const derivedSecret = () => createHmac("sha256", "test-secret").update("share-token").digest("hex");

// A token shaped like a real one, with one part swapped out.
const craft = ({ secret = derivedSecret(), audience = "share" } = {}) =>
  jwt.sign({ v: version }, secret, { subject: share._id.toString(), audience, expiresIn: "1h" });

describe("verifyShareToken", () => {
  it("accepts a token it issued for the Share's current password", () => {
    expect(verifyShareToken(issueShareToken(share), share)).toBe(true);
    expect(verifyShareToken(craft(), share)).toBe(true);
  });

  it("rejects a token signed with the session secret", () => {
    expect(verifyShareToken(craft({ secret: "test-secret" }), share)).toBe(false);
  });

  it("rejects a token for another audience", () => {
    expect(verifyShareToken(craft({ audience: "session" }), share)).toBe(false);
  });
});
