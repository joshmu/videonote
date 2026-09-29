import bcrypt from "bcryptjs";
import isEmail from "validator/lib/isEmail";
import normalizeEmail from "validator/lib/normalizeEmail";

import { generateAccessToken } from "@/utils/jwt";
import { Note, Settings, Share, User, type UserDoc } from "@/utils/mongoose";
import { removeUserProjects } from "@/utils/project/projectIntake";

export type Session = { kind: "ok"; user: UserDoc; token: string };
/** `missing`: an absent, empty or non-string field; `email`: not an email address. */
export type Invalid = { kind: "invalid"; reason: "missing" | "email" };
export type EmailTaken = { kind: "emailTaken" };
export type NotFound = { kind: "notFound" };
export type WrongPassword = { kind: "wrongPassword" };

export type Credentials = { email?: unknown; password?: unknown };
export type ProfileInput = { username?: unknown; email?: unknown; [key: string]: unknown };

const MONGO_DUPLICATE_KEY = 11000;
const isDuplicateKey = (err: unknown): boolean =>
  typeof err === "object" &&
  err !== null &&
  (err as { code?: number }).code === MONGO_DUPLICATE_KEY;

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

const session = (user: UserDoc): Session => ({
  kind: "ok",
  user,
  token: generateAccessToken(user.email),
});

const passwordMatches = async (user: UserDoc, password: unknown): Promise<boolean> =>
  isFilled(password) && isFilled(user.password) && bcrypt.compare(password, user.password);

/** Create a User; the unique email index decides whether the email is taken. */
export const register = async (input: Credentials): Promise<Session | Invalid | EmailTaken> => {
  const parsed = parseCredentials(input);
  if ("kind" in parsed) return parsed;
  try {
    const user = await User.create({
      email: parsed.email,
      username: parsed.email,
      password: await bcrypt.hash(parsed.password, 10),
    });
    return session(user);
  } catch (error) {
    if (isDuplicateKey(error)) return { kind: "emailTaken" };
    throw error;
  }
};

export const authenticate = async (
  input: Credentials,
): Promise<Session | Invalid | NotFound | WrongPassword> => {
  const parsed = parseCredentials(input);
  if ("kind" in parsed) return parsed;
  const user = await User.findOne({ email: parsed.email });
  if (!user) return { kind: "notFound" };
  if (!(await passwordMatches(user, parsed.password))) return { kind: "wrongPassword" };
  return session(user);
};

/**
 * Change the profile fields a user may edit: `username` and `email`. Every
 * other field is ignored. The returned token is minted for the saved email so
 * the caller's session survives an email change.
 */
export const updateProfile = async (
  user: UserDoc,
  input: ProfileInput = {},
): Promise<Session | Invalid | EmailTaken> => {
  const changes: { username?: string; email?: string } = {};
  if (typeof input.username === "string") changes.username = input.username;
  if (input.email !== undefined) {
    const email = typeof input.email === "string" ? readEmail(input.email) : null;
    if (!email) return { kind: "invalid", reason: "email" };
    changes.email = email;
  }
  user.set(changes);
  try {
    await user.save();
  } catch (error) {
    if (isDuplicateKey(error)) return { kind: "emailTaken" };
    throw error;
  }
  return session(user);
};

/**
 * Delete the account after checking its password: owned Projects (via the
 * Project intake cascade, which takes their Notes), Shares, Settings, then
 * the User. Notes the user wrote on other owners' Projects are kept with no
 * author. Any failed step throws with the User still in place, so the removal
 * can be re-run.
 */
export const removeAccount = async (
  user: UserDoc,
  password: unknown,
): Promise<{ kind: "ok" } | WrongPassword> => {
  if (!(await passwordMatches(user, password))) return { kind: "wrongPassword" };
  await removeUserProjects(user._id);
  // Only Notes on other owners' Projects are left after the cascade.
  await Note.updateMany({ user: user._id }, { $unset: { user: 1 } });
  await Share.deleteMany({ user: user._id });
  await Settings.deleteMany({ user: user._id });
  await User.deleteOne({ _id: user._id });
  return { kind: "ok" };
};
