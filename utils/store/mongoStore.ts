import { isObjectIdOrHexString } from "mongoose";

import { connectDb, Note, Project, Settings, Share, User } from "@/utils/mongoose";

import type {
  Author,
  Id,
  NoteRecord,
  NoteView,
  ProjectRecord,
  ProjectView,
  SettingsRecord,
  ShareRecord,
  Store,
  UserRecord,
} from "./types";

const MONGO_DUPLICATE_KEY = 11000;
const isDuplicateKey = (err: unknown): boolean =>
  typeof err === "object" &&
  err !== null &&
  (err as { code?: number }).code === MONGO_DUPLICATE_KEY;

// Lean documents as Mongoose returns them; only the fields read here.
type Lean = Record<string, any>;

const str = (id: unknown): Id => String(id);

const toSettings = (doc: Lean | null | undefined): SettingsRecord | null =>
  doc
    ? {
        _id: str(doc._id),
        currentProject: doc.currentProject
          ? str(doc.currentProject)
          : (doc.currentProject ?? undefined),
        playOffset: doc.playOffset ?? undefined,
        showHints: doc.showHints ?? true,
        seekJump: doc.seekJump ?? undefined,
        sidebarWidth: doc.sidebarWidth ?? undefined,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }
    : null;

const toUser = (doc: Lean | null, settings: Lean | null): UserRecord | null =>
  doc
    ? {
        _id: str(doc._id),
        email: doc.email,
        username: doc.username ?? undefined,
        passwordHash: doc.password ?? "",
        role: doc.role ?? "free",
        projectIds: (doc.projects ?? []).map(str),
        settings: toSettings(settings),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }
    : null;

const toShare = (doc: Lean | null | undefined): ShareRecord | null =>
  doc
    ? {
        _id: str(doc._id),
        url: doc.url,
        canEdit: doc.canEdit ?? true,
        passwordHash: doc.password ?? "",
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }
    : null;

const toProject = (doc: Lean, share: Lean | null): ProjectRecord => ({
  _id: str(doc._id),
  ownerId: str(doc.user),
  title: doc.title,
  src: doc.src ?? undefined,
  share: toShare(share),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

// Legacy Notes may lack `project`, a `time` or a `done`; they read as the Project listing them, 0 and false.
const toNote = (doc: Lean, projectId?: Id): NoteRecord => ({
  _id: str(doc._id),
  projectId: doc.project ? str(doc.project) : projectId!,
  content: doc.content,
  time: doc.time ?? 0,
  done: doc.done ?? false,
  ...(doc.user && { authorId: str(doc.user._id ?? doc.user) }),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

// A populated author, or null when the Note has none or the User is gone.
const toAuthor = (user: unknown): Author | null => {
  const author = user as Lean | null | undefined;
  if (!author?._id || !author.email) return null;
  return { _id: str(author._id), username: author.username ?? undefined, email: author.email };
};

const toNoteView = (doc: Lean, projectId?: Id): NoteView => {
  const note = toNote(doc, projectId);
  const author = toAuthor(doc.user);
  // An author id whose User is gone reads as a guest's Note.
  if (!author) delete note.authorId;
  return { ...note, author };
};

const AUTHOR_FIELDS = "username email";

// A Project's Share, only while the Share still belongs to that Project.
const loadShare = (id: unknown, projectId: unknown): Promise<Lean | null> =>
  id
    ? Share.findOne({ _id: id, project: projectId }).select("+password").lean()
    : Promise.resolve(null);

const toProjectView = async (doc: Lean | null): Promise<ProjectView | null> => {
  if (!doc) return null;
  const projectId = str(doc._id);
  // The Project's own list decides which Notes it has, in its order.
  const notes = await Note.find({ _id: { $in: doc.notes ?? [] } })
    .populate("user", AUTHOR_FIELDS)
    .lean();
  const byId = new Map(notes.map((note) => [str(note._id), note]));
  return {
    ...toProject(doc, await loadShare(doc.share, doc._id)),
    notes: (doc.notes ?? [])
      .map((id: unknown) => byId.get(str(id)))
      .filter(Boolean)
      .map((note: Lean) => toNoteView(note, projectId)),
  };
};

const validId = (id: unknown): id is Id => isObjectIdOrHexString(id);

/** The Store over MongoDB through Mongoose. Opens the connection on creation. */
export const createMongoStore = async (): Promise<Store> => {
  await connectDb();

  const getUser: Store["getUser"] = async (id) => {
    if (!validId(id)) return null;
    const user = await User.findById(id).lean();
    return toUser(user, user?.settings ? await Settings.findById(user.settings).lean() : null);
  };

  const getProject: Store["getProject"] = async (id) => {
    if (!validId(id)) return null;
    const doc = await Project.findById(id).lean();
    return doc ? toProject(doc, await loadShare(doc.share, doc._id)) : null;
  };

  const loadProject: Store["loadProject"] = async (id) =>
    validId(id) ? toProjectView(await Project.findById(id).lean()) : null;

  return {
    getUser,

    findUserByEmail: async (email) => {
      const user = await User.findOne({ email }).lean();
      return user ? getUser(str(user._id)) : null;
    },

    createUser: async ({ email, username, passwordHash }) => {
      try {
        const user = await User.create({ email, username, password: passwordHash });
        return toUser(user.toObject(), null)!;
      } catch (error) {
        if (isDuplicateKey(error)) return "emailTaken";
        throw error;
      }
    },

    updateProfile: async (id, changes) => {
      try {
        await User.updateOne({ _id: id }, { $set: changes });
      } catch (error) {
        if (isDuplicateKey(error)) return "emailTaken";
        throw error;
      }
      return (await getUser(id))!;
    },

    saveSettings: async (userId, changes) => {
      const user = await User.findById(userId).lean();
      const existing = user?.settings
        ? await Settings.findOne({ _id: user.settings, user: userId })
        : null;
      if (existing) {
        existing.set(changes);
        await existing.save();
        return toSettings(existing.toObject())!;
      }
      const created = await Settings.create({ ...changes, user: userId });
      await User.updateOne({ _id: userId }, { $set: { settings: created._id } });
      return toSettings(created.toObject())!;
    },

    removeUser: async (user) => {
      await Note.updateMany({ user: user._id }, { $unset: { user: 1 } });
      await Share.deleteMany({ user: user._id });
      await Settings.deleteMany({ user: user._id });
      await User.deleteOne({ _id: user._id });
    },

    createProject: async (ownerId, fields) => {
      const project = await Project.create({ ...fields, user: ownerId });
      await User.updateOne({ _id: ownerId }, { $push: { projects: project._id } });
      return toProject(project.toObject(), null);
    },

    ownedProjectIds: async (ownerId) =>
      (await Project.find({ user: ownerId }, "_id").lean()).map((doc) => str(doc._id)),

    getProject,
    loadProject,

    loadProjects: async (ids) => {
      const docs = await Project.find({ _id: { $in: ids.filter(validId) } }).lean();
      const byId = new Map(docs.map((doc) => [str(doc._id), doc]));
      const views = await Promise.all(ids.map((id) => toProjectView(byId.get(id) ?? null)));
      return views.filter((view): view is ProjectView => view !== null);
    },

    updateProject: async (id, fields) => {
      if (!validId(id)) return null;
      await Project.updateOne({ _id: id }, { $set: fields });
      return getProject(id);
    },

    removeProject: async (project) => {
      const doc = await Project.findById(project._id).lean();
      await Note.deleteMany({
        $or: [{ project: project._id }, { _id: { $in: doc?.notes ?? [] } }],
      });
      await Share.deleteMany({ project: project._id });
      await User.updateOne({ _id: project.ownerId }, { $pull: { projects: project._id } });
      await Project.deleteOne({ _id: project._id });
    },

    putShare: async (projectId, changes) => {
      const project = await Project.findById(projectId);
      if (!project) throw new Error(`Project ${projectId} not found`);
      const fields = {
        ...("url" in changes && { url: changes.url }),
        ...("canEdit" in changes && { canEdit: changes.canEdit }),
        ...("passwordHash" in changes && { password: changes.passwordHash }),
      };
      try {
        if (project.share) {
          await Share.updateOne({ _id: project.share }, { $set: fields });
          return toShare(await loadShare(project.share, project._id))!;
        }
        const created = await Share.create({ ...fields, project: project._id, user: project.user });
        project.share = created._id;
        await project.save();
        return toShare(await loadShare(created._id, project._id))!;
      } catch (error) {
        if (isDuplicateKey(error)) return "urlTaken";
        throw error;
      }
    },

    removeShare: async (projectId, shareId) => {
      if (!validId(shareId)) return;
      const project = await Project.findById(projectId);
      if (!project) return;
      await Share.deleteOne({ _id: shareId, project: project._id, user: project.user });
      if (project.share?.equals(shareId)) {
        project.share = null;
        await project.save();
      }
    },

    findShareByUrl: async (url) => {
      const share = await Share.findOne({ url }).select("+password").lean();
      if (!share?.project) return null;
      return { share: toShare(share)!, projectId: str(share.project) };
    },

    getNote: async (id) => {
      if (!validId(id)) return null;
      const note = await Note.findById(id).lean();
      return note ? toNote(note) : null;
    },

    loadNote: async (id) => {
      if (!validId(id)) return null;
      const note = await Note.findById(id).populate("user", AUTHOR_FIELDS).lean();
      return note ? toNoteView(note) : null;
    },

    listNotes: async (projectId) => {
      const notes = await Note.find({ project: projectId }).populate("user", AUTHOR_FIELDS).lean();
      return notes.map((note) => toNoteView(note, projectId));
    },

    createNote: async ({ _id, projectId, content, time, done, authorId }) => {
      const note = await Note.create({
        _id,
        content,
        time,
        done,
        project: projectId,
        ...(authorId && { user: authorId }),
      });
      await Project.updateOne({ _id: projectId }, { $push: { notes: note._id } });
      return toNote(note.toObject());
    },

    updateNote: async (id, changes) => {
      const note = await Note.findById(id);
      if (!note) throw new Error(`Note ${id} not found`);
      note.set(changes);
      await note.save();
      return toNote(note.toObject());
    },

    removeDoneNotes: async (projectId) => {
      const done = await Note.find({ project: projectId, done: true }, "_id").lean();
      const doneIds = done.map((note) => note._id);
      await Note.deleteMany({ _id: { $in: doneIds } });
      await Project.updateOne({ _id: projectId }, { $pull: { notes: { $in: doneIds } } });
    },
  };
};
