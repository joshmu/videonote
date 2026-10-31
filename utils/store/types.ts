/**
 * The persistence seam. Intakes own validation, permissions, hashing and
 * projections; a Store only reads and writes plain records. Ids are 24
 * character hex strings (ObjectId format) whatever the backend.
 */
export type Id = string;

export type SettingsRecord = {
  _id: Id;
  currentProject?: Id | null;
  playOffset?: number;
  showHints: boolean;
  seekJump?: number;
  sidebarWidth?: number;
  createdAt: Date;
  updatedAt: Date;
};

/** The Settings fields a client may write. */
export type SettingsChanges = Partial<
  Pick<SettingsRecord, "currentProject" | "playOffset" | "showHints" | "seekJump" | "sidebarWidth">
>;

export type UserRecord = {
  _id: Id;
  email: string;
  username?: string;
  /** bcrypt hash; empty when the account has no password. */
  passwordHash: string;
  role: string;
  /** The User's Projects in the order they list. */
  projectIds: Id[];
  settings: SettingsRecord | null;
  /** The last UTC day (YYYY-MM-DD) the User made a signed-in request. Absent until the first one. */
  lastSeenOn?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ShareRecord = {
  _id: Id;
  url: string;
  canEdit: boolean;
  /** bcrypt hash; empty when the Share is open. */
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

/** The Share fields an owner may write, the password already hashed ("" removes it). */
export type ShareChanges = { url?: string; canEdit?: boolean; passwordHash?: string };

export type ProjectRecord = {
  _id: Id;
  ownerId: Id;
  title: string;
  src?: string;
  share: ShareRecord | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NoteRecord = {
  _id: Id;
  projectId: Id;
  content: string;
  time: number;
  done: boolean;
  /** Absent for a guest's Note, or once the author removed their account. */
  authorId?: Id;
  createdAt: Date;
  updatedAt: Date;
};

/** A Note author as a Store resolves them; projections decide what is public. */
export type Author = { _id: Id; username?: string; email: string };

/** A Note with its author resolved (`null` for a guest or a removed account). */
export type NoteView = NoteRecord & { author: Author | null };

/** A Project with its Notes, each with its author. */
export type ProjectView = ProjectRecord & { notes: NoteView[] };

export type NewNote = Pick<NoteRecord, "_id" | "projectId" | "content" | "time" | "done"> & {
  authorId?: Id;
};

export type NoteChanges = Partial<Pick<NoteRecord, "content" | "time" | "done">>;

export interface Store {
  getUser(id: Id): Promise<UserRecord | null>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  /** `emailTaken` when another User has the email. */
  createUser(input: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<UserRecord | "emailTaken">;
  updateProfile(
    id: Id,
    changes: { username?: string; email?: string },
  ): Promise<UserRecord | "emailTaken">;
  /** Record the day the User was last seen. Leaves `updatedAt` alone; a no-op once the User is gone. */
  markSeen(id: Id, day: string): Promise<void>;
  /** Write the User's Settings, creating them on first save. */
  saveSettings(userId: Id, changes: SettingsChanges): Promise<SettingsRecord>;
  /**
   * Remove the User after their Projects are gone. Their Notes on other
   * owners' Projects stop resolving an author.
   */
  removeUser(user: UserRecord): Promise<void>;

  /** Create a Project and append it to its owner's list. */
  createProject(ownerId: Id, fields: { title: string; src?: string }): Promise<ProjectRecord>;
  /** Every Project the User owns, listed or not. */
  ownedProjectIds(ownerId: Id): Promise<Id[]>;
  getProject(id: Id): Promise<ProjectRecord | null>;
  loadProject(id: Id): Promise<ProjectView | null>;
  /** The Projects for `ids`, in that order, skipping any that are gone. */
  loadProjects(ids: Id[]): Promise<ProjectView[]>;
  updateProject(id: Id, fields: { title?: string; src?: string }): Promise<ProjectRecord | null>;
  /**
   * Remove a Project with its Notes, its Share and its place in the owner's
   * list. Each step is a no-op when already done and the Project goes last,
   * so a failed removal can be re-run.
   */
  removeProject(project: ProjectRecord): Promise<void>;

  /** Create the Project's Share, or update the one it has. `urlTaken` when another Share has the url. */
  putShare(projectId: Id, changes: ShareChanges): Promise<ShareRecord | "urlTaken">;
  /** Remove the Project's Share if it is `shareId`. */
  removeShare(projectId: Id, shareId: Id): Promise<void>;
  findShareByUrl(url: string): Promise<{ share: ShareRecord; projectId: Id } | null>;

  getNote(id: Id): Promise<NoteRecord | null>;
  loadNote(id: Id): Promise<NoteView | null>;
  listNotes(projectId: Id): Promise<NoteView[]>;
  createNote(note: NewNote): Promise<NoteRecord>;
  updateNote(id: Id, changes: NoteChanges): Promise<NoteRecord>;
  removeDoneNotes(projectId: Id): Promise<void>;
}
