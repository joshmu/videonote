import mongoose from 'mongoose'
const { Schema } = mongoose

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
})

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String },
    projectIds: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    settings: {
      playOffset: Number,
      showHints: Boolean,
      seekJump: Number,
      sidebarWidth: Number,
      currentProjectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    },
    role: { type: String, default: 'free' },
    notes: String,
    password: String,
  },
  {
    timestamps: { currentTime: () => Math.floor(Date.now() / 1000) },
  }
)

const projectSchema = new Schema(
  {
    title: { type: String, required: true },
    src: String,
    todos: [
      {
        id: { type: String, required: true },
        msg: { type: String, required: true },
        time: Number,
        done: Boolean,
      },
    ],
    notes: String,
    isPrivate: { type: Boolean, default: true },
    userIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: { currentTime: () => Math.floor(Date.now() / 1000) },
  }
)

// prevent overwrite model error
let User
try {
  User = mongoose.model('User')
} catch (error) {
  User = mongoose.model('User', userSchema)
}
let Project
try {
  Project = mongoose.model('Project')
} catch (error) {
  Project = mongoose.model('Project', projectSchema)
}

export { User, Project }
