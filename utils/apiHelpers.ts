import type { SettingsRecord, UserRecord } from "@/utils/store";

/** A User as the account owner receives it: no password hash, no timestamps. */
export type AccountUser = {
  _id: string;
  email: string;
  username?: string;
  role: string;
  projects: string[];
  settings?: string;
};

export const toAccountUser = (user: UserRecord): AccountUser => ({
  _id: user._id,
  email: user.email,
  ...(user.username !== undefined && { username: user.username }),
  role: user.role,
  projects: user.projectIds,
  ...(user.settings && { settings: user.settings._id }),
});

/** Settings as `/api/settings` and `/api/auth` send them. */
export const toSettingsReply = (userId: string, settings: SettingsRecord) => ({
  ...settings,
  user: userId,
});
