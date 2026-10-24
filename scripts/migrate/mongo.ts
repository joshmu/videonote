import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

import mongoose from "mongoose";

import type { Snapshot } from "./transform";

/** Snapshots hold user data, so they live outside the repo, readable by this user only. */
export const SNAPSHOT_DIR = path.join(homedir(), ".local", "share", "videonote-migration");

// ObjectIds become hex strings and Dates ISO strings, all the way down.
const plain = (value: unknown): unknown => {
  if (value instanceof mongoose.Types.ObjectId) return value.toHexString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, plain(inner)]));
  }
  return value;
};

/** The open Mongoose connection's database, connecting to MONGODB_URI first if needed. */
export const connectMongo = async () => {
  if (mongoose.connection.readyState !== 1) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set");
    await mongoose.connect(uri);
  }
  return mongoose.connection.db!;
};

/** Read every collection the app uses, raw (Share passwords included). */
export const exportSnapshot = async (): Promise<Snapshot> => {
  const db = await connectMongo();
  const read = async (name: string) => plain(await db.collection(name).find({}).toArray()) as never;
  const exportedAt = new Date().toISOString();
  const [users, projects, notes, shares, settings] = await Promise.all(
    ["users", "projects", "notes", "shares", "settings"].map(read),
  );
  return { exportedAt, users, projects, notes, shares, settings };
};

export const writeSnapshot = (snapshot: Snapshot, file?: string): string => {
  mkdirSync(SNAPSHOT_DIR, { recursive: true, mode: 0o700 });
  chmodSync(SNAPSHOT_DIR, 0o700);
  const target =
    file ?? path.join(SNAPSHOT_DIR, `snapshot-${snapshot.exportedAt.replace(/[:.]/g, "-")}.json`);
  writeFileSync(target, JSON.stringify(snapshot), { mode: 0o600 });
  return target;
};
