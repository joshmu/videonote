import bcrypt from "bcryptjs";

/**
 * Outcome of attempting to access a share with a candidate password.
 *
 * - `open`: the share has no password set; access is unrestricted
 * - `passwordRequired`: a password is set but the caller did not supply one
 * - `incorrect`: a password was supplied but does not match
 * - `ok`: the supplied password matches the stored hash
 */
export type ShareAccessResult =
  | { kind: "open" }
  | { kind: "passwordRequired" }
  | { kind: "incorrect" }
  | { kind: "ok" };

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Decide whether the caller is allowed to read a share, given the share's
 * stored password hash and the candidate password they supplied.
 *
 * Null/empty stored hash means the share is unprotected. A protected share
 * with no candidate returns `passwordRequired` — distinguishing "you forgot
 * to send a password" from "your password is wrong".
 */
export const verifySharePassword = async (
  storedHash: string | null | undefined,
  candidate: string | null | undefined,
): Promise<ShareAccessResult> => {
  if (!storedHash || storedHash.length === 0) return { kind: "open" };
  if (!candidate) return { kind: "passwordRequired" };
  const match = await bcrypt.compare(candidate, storedHash);
  return match ? { kind: "ok" } : { kind: "incorrect" };
};

/**
 * Hash a plaintext password for persistence on a Share document.
 *
 * Returns `null` for empty/null input — callers should treat that as "no
 * password protection". This keeps the protection contract symmetrical with
 * {@link verifySharePassword}.
 */
export const hashSharePassword = async (
  plaintext: string | null | undefined,
): Promise<string | null> => {
  if (!plaintext || plaintext.length === 0) return null;
  return bcrypt.hash(plaintext, BCRYPT_SALT_ROUNDS);
};
