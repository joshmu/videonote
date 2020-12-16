/**
 * @path /utils/mongoose.ts
 *
 * @project videonote
 * @file mongoose.ts
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 13th October 2020
 * @modified Wednesday, 16th December 2020 2:55:07 pm
 * @copyright © 2020 - 2020 MU
 */

import mongoose from 'mongoose'
const { Schema } = mongoose

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
})

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String },
    projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    settings: { type: Schema.Types.ObjectId, ref: 'Settings' },
    role: { type: String, default: 'free' },
    password: String,
  },
  { timestamps: true }
)

const ProjectSchema = new Schema(
  {
    title: { type: String, required: true },
    src: String,
    notes: [{ type: Schema.Types.ObjectId, ref: 'Note' }],
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sharedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    share: {
      type: Schema.Types.ObjectId,
      ref: 'Share',
    },
  },
  { timestamps: true }
)

const NoteSchema = new Schema(
  {
    content: { type: String, required: true },
    time: { type: Number, default: 0 },
    done: { type: Boolean, default: false },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
  },
  { timestamps: true }
)

const SettingsSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    currentProject: { type: Schema.Types.ObjectId, ref: 'Project' },
    playOffset: Number,
    showHints: { type: Boolean, default: true },
    seekJump: Number,
    sidebarWidth: Number,
  },
  { timestamps: true }
)

const ShareProjectSchema = new Schema(
  {
    url: { type: String, required: true, unique: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    password: { type: String, default: '' },
    canEdit: { type: Boolean, default: true },
  },
  { timestamps: true }
)

// prevent overwrite model error
let User
try {
  User = mongoose.model('User')
} catch (error) {
  User = mongoose.model('User', UserSchema)
}
let Project
try {
  Project = mongoose.model('Project')
} catch (error) {
  Project = mongoose.model('Project', ProjectSchema)
}
let Note
try {
  Note = mongoose.model('Note')
} catch (error) {
  Note = mongoose.model('Note', NoteSchema)
}
let Settings
try {
  Settings = mongoose.model('Settings')
} catch (error) {
  Settings = mongoose.model('Settings', SettingsSchema)
}
let Share
try {
  Share = mongoose.model('Share')
} catch (error) {
  Share = mongoose.model('Share', ShareProjectSchema)
}

export { User, Project, Note, Settings, Share }
