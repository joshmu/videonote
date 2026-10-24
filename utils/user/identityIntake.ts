import bcrypt from "bcryptjs";
import isEmail from "validator/lib/isEmail";
import normalizeEmail from "validator/lib/normalizeEmail";

import { generateAccessToken } from "@/utils/jwt";
import { removeUserProjects } from "@/utils/project/projectIntake";
import { getStore, type UserRecord } from "@/utils/store";

export type Session = { kind: "ok"; user: UserRecord; token: string };
/** `missing`: an absent, empty or non-string field; `email`: not an email address. */
export type Invalid = { kind: "invalid"; reason: "missing" | "email" };
export type EmailTaken = { kind: "emailTaken" };
export type NotFound = { kind: "notFound" };
export type WrongPassword = { kind: "wrongPassword" };

export type Credentials = { email?: unknown; password?: unknown };
export type ProfileInput = { username?: unknown; email?: unknown; [key: string]: unknown };

const isFilled = (value: unknown): value is string => typeof value === "string" && value !== "";

const readEmail = (raw: string): string | null =>
  isEmail(raw.trim()) ? (normalizeEmail(raw.trim()) as string | false) || null : null;

type ParsedCredentials = { email: string; password: string } | Invalid;

const parseCredentials = ({ email, password }: Credentials = {}): ParsedCredentials => {
  if (!isFilled(email) || !isFilled(password)) return { kind: "invalid", reason: "missing" };
  const normalised = readEmail(email);
  if (!normalised) return { kind: "invalid", reason: "email" };
  return { email: normalised, password };
};

const session = (user: UserRecord): Session => ({
  kind: "ok",
  user,
  token: generateAccessToken(user._id),
});

const passwordMatches = async (user: UserRecord, password: unknown): Promise<boolean> =>
  isFilled(password) && isFilled(user.passwordHash) && bcrypt.compare(password, user.passwordHash);

/** Create a User; the Store decides atomically whether the email is taken. */
export const register = async (input: Credentials): Promise<Session | Invalid | EmailTaken> => {
  const parsed = parseCredentials(input);
  if ("kind" in parsed) return parsed;
  const user = await (
    await getStore()
  ).createUser({
    email: parsed.email,
    username: parsed.email,
    passwordHash: await bcrypt.hash(parsed.password, 10),
  });
  return user === "emailTaken" ? { kind: "emailTaken" } : session(user);
};

export const authenticate = async (
  input: Credentials,
): Promise<Session | Invalid | NotFound | WrongPassword> => {
  const parsed = parseCredentials(input);
  if ("kind" in parsed) return parsed;
  const user = await (await getStore()).findUserByEmail(parsed.email);
  if (!user) return { kind: "notFound" };
  if (!(await passwordMatches(user, parsed.password))) return { kind: "wrongPassword" };
  return session(user);
};

/**
 * Change the profile fields a user may edit: `username` and `email`. Every
 * other field is ignored. The session token's subject is the User._id, so an
 * email change keeps the session; a fresh token is still returned.
 */
export const updateProfile = async (
  user: UserRecord,
  input: ProfileInput = {},
): Promise<Session | Invalid | EmailTaken> => {
  const changes: { username?: string; email?: string } = {};
  if (typeof input.username === "string") changes.username = input.username;
  if (input.email !== undefined) {
    const email = typeof input.email === "string" ? readEmail(input.email) : null;
    if (!email) return { kind: "invalid", reason: "email" };
    changes.email = email;
  }
  const updated = await (await getStore()).updateProfile(user._id, changes);
  return updated === "emailTaken" ? { kind: "emailTaken" } : session(updated);
};

/**
 * Delete the account after checking its password: owned Projects (via the
 * Project intake cascade, which takes their Notes and Shares), then the User
 * with its Settings. Notes the user wrote on other owners' Projects are kept with no
 * author. Any failed step throws with the User still in place, so the removal
 * can be re-run.
 */
export const removeAccount = async (
  user: UserRecord,
  password: unknown,
): Promise<{ kind: "ok" } | WrongPassword> => {
  if (!(await passwordMatches(user, password))) return { kind: "wrongPassword" };
  await removeUserProjects(user._id);
  await (await getStore()).removeUser(user);
  return { kind: "ok" };
};
