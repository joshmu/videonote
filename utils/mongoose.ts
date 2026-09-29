/**
 * @path /utils/mongoose.ts
 *
 * @project videonote
 * @file mongoose.ts
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 13th October 2020
 * @modified Sunday, 23rd January 2022 5:51:11 pm
 * @copyright © 2020 - 2020 MU
 */

import mongoose, { type HydratedDocFromModel, Schema } from "mongoose";

let connecting: Promise<typeof mongoose> | null = null;

/**
 * The one way server entry paths open the database. Reuses the pending or
 * open connection; a failed attempt is retried on the next call.
 */
export const connectDb = (): Promise<typeof mongoose> => {
  connecting ??= mongoose.connect(process.env.MONGODB_URI).catch((error) => {
    connecting = null;
    throw error;
  });
  return connecting;
};

const UserSchema = Schema.create(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String },
    projects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
    settings: { type: Schema.Types.ObjectId, ref: "Settings" },
    role: { type: String, default: "free" },
    password: String,
  },
  { timestamps: true },
);

const ProjectSchema = Schema.create(
  {
    title: { type: String, required: true },
    src: String,
    notes: [{ type: Schema.Types.ObjectId, ref: "Note" }],
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sharedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    share: {
      type: Schema.Types.ObjectId,
      ref: "Share",
    },
  },
  { timestamps: true },
);

const NoteSchema = Schema.create(
  {
    content: { type: String, required: true },
    time: { type: Number, default: 0 },
    done: { type: Boolean, default: false },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    project: { type: Schema.Types.ObjectId, ref: "Project" },
  },
  { timestamps: true },
);

const SettingsSchema = Schema.create(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    currentProject: { type: Schema.Types.ObjectId, ref: "Project" },
    playOffset: Number,
    showHints: { type: Boolean, default: true },
    seekJump: Number,
    sidebarWidth: Number,
  },
  { timestamps: true },
);

const ShareProjectSchema = Schema.create(
  {
    url: { type: String, required: true, unique: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: { type: Schema.Types.ObjectId, ref: "Project" },
    password: { type: String, default: "" },
    canEdit: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Next.js re-evaluates this module on reload; recompiling replaces the model.
const defineModel = <TSchema extends Schema>(name: string, schema: TSchema) =>
  mongoose.model(name, schema, undefined, { overwriteModels: true });

export const User = defineModel("User", UserSchema);
export const Project = defineModel("Project", ProjectSchema);
export const Note = defineModel("Note", NoteSchema);
export const Settings = defineModel("Settings", SettingsSchema);
export const Share = defineModel("Share", ShareProjectSchema);

export type UserDoc = HydratedDocFromModel<typeof User>;
export type ProjectDoc = HydratedDocFromModel<typeof Project>;
export type NoteDoc = HydratedDocFromModel<typeof Note>;
export type SettingsDoc = HydratedDocFromModel<typeof Settings>;
export type ShareDoc = HydratedDocFromModel<typeof Share>;
