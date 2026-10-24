import { items } from "@/utils/store/dynamoStore";
import type {
  NoteRecord,
  ProjectRecord,
  SettingsRecord,
  ShareRecord,
  UserRecord,
} from "@/utils/store/types";

/**
 * A MongoDB export, ids as hex strings and dates as ISO strings. Written by
 * `export`, read by `plan` / `sync`. Holds user data: keep it out of the repo.
 */
export type Snapshot = {
  exportedAt: string;
  users: RawUser[];
  projects: RawProject[];
  notes: RawNote[];
  shares: RawShare[];
  settings: RawSettings[];
};

type Stamps = { createdAt?: string | null; updatedAt?: string | null };
export type RawUser = Stamps & {
  _id: string;
  email: string;
  username?: string | null;
  password?: string | null;
  role?: string | null;
  projects?: string[];
  settings?: string | null;
};
export type RawProject = Stamps & {
  _id: string;
  title: string;
  src?: string | null;
  user: string;
  notes?: string[];
  share?: string | null;
};
export type RawNote = Stamps & {
  _id: string;
  content: string;
  time?: number | null;
  done?: boolean | null;
  user?: string | null;
  project?: string | null;
};
export type RawShare = Stamps & {
  _id: string;
  url: string;
  user?: string | null;
  project?: string | null;
  password?: string | null;
  canEdit?: boolean | null;
};
export type RawSettings = Stamps & {
  _id: string;
  user: string;
  currentProject?: string | null;
  playOffset?: number | null;
  showHints?: boolean | null;
  seekJump?: number | null;
  sidebarWidth?: number | null;
};

/** What the transform left out, and why: records nothing in the app can reach. */
export type Report = {
  users: number;
  projects: number;
  notes: number;
  shares: number;
  settings: number;
  skipped: {
    projectsOwnerMissing: string[];
    projectsNotInOwnerList: string[];
    projectRefsDangling: number;
    noteRefsDangling: number;
    notesNotListed: string[];
    notesListedTwice: string[];
    notesListedElsewhere: string[];
    noteAuthorsMissing: number;
    sharesNotLinked: string[];
    settingsNotLinked: string[];
  };
};

// Legacy documents may lack timestamps: fall back to the time in the ObjectId.
const idTime = (id: string) => new Date(parseInt(id.slice(0, 8), 16) * 1000);
const stamps = (doc: Stamps & { _id: string }) => {
  const createdAt = doc.createdAt ? new Date(doc.createdAt) : idTime(doc._id);
  return { createdAt, updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : createdAt };
};

const byId = <T extends { _id: string }>(list: T[]) => new Map(list.map((doc) => [doc._id, doc]));

/**
 * The records the DynamoDB store should hold for a snapshot, read the way the
 * Mongo store reads them today: a User's Projects are the ones they list and
 * own, a Project's Notes the ones it lists (in order), a Project's Share only
 * while it points back at the Project, a User's Settings the ones they
 * reference. Anything else is unreachable in the app and reported, not
 * migrated.
 */
export const toRecords = (snapshot: Snapshot) => {
  const users = byId(snapshot.users);
  const projects = byId(snapshot.projects);
  const notes = byId(snapshot.notes);
  const shares = byId(snapshot.shares);
  const settings = byId(snapshot.settings);

  const report: Report = {
    users: 0,
    projects: 0,
    notes: 0,
    shares: 0,
    settings: 0,
    skipped: {
      projectsOwnerMissing: [],
      projectsNotInOwnerList: [],
      projectRefsDangling: 0,
      noteRefsDangling: 0,
      notesNotListed: [],
      notesListedTwice: [],
      notesListedElsewhere: [],
      noteAuthorsMissing: 0,
      sharesNotLinked: [],
      settingsNotLinked: [],
    },
  };
  const { skipped } = report;

  // A Project is reachable when its owner exists and lists it.
  const listed = new Set<string>();
  for (const user of snapshot.users) {
    for (const projectId of user.projects ?? []) {
      const project = projects.get(projectId);
      if (!project) skipped.projectRefsDangling++;
      else if (project.user === user._id) listed.add(projectId);
    }
  }
  for (const project of snapshot.projects) {
    if (!users.has(project.user)) skipped.projectsOwnerMissing.push(project._id);
    else if (!listed.has(project._id)) skipped.projectsNotInOwnerList.push(project._id);
  }

  const userRecords: UserRecord[] = [];
  const usedSettings = new Set<string>();
  for (const user of snapshot.users) {
    const raw = user.settings ? settings.get(user.settings) : undefined;
    if (raw) usedSettings.add(raw._id);
    const settingsRecord: SettingsRecord | null = raw
      ? {
          _id: raw._id,
          ...(raw.currentProject != null && { currentProject: raw.currentProject }),
          ...(raw.playOffset != null && { playOffset: raw.playOffset }),
          showHints: raw.showHints ?? true,
          ...(raw.seekJump != null && { seekJump: raw.seekJump }),
          ...(raw.sidebarWidth != null && { sidebarWidth: raw.sidebarWidth }),
          ...stamps(raw),
        }
      : null;
    userRecords.push({
      _id: user._id,
      email: user.email,
      ...(user.username != null && { username: user.username }),
      passwordHash: user.password ?? "",
      role: user.role ?? "free",
      projectIds: (user.projects ?? []).filter(
        (id) => listed.has(id) && projects.get(id)!.user === user._id,
      ),
      settings: settingsRecord,
      ...stamps(user),
    });
  }
  for (const raw of snapshot.settings) {
    if (!usedSettings.has(raw._id)) skipped.settingsNotLinked.push(raw._id);
  }

  const projectRecords: ProjectRecord[] = [];
  const noteRecords: NoteRecord[] = [];
  const usedShares = new Set<string>();
  const claimedNotes = new Set<string>();
  for (const project of snapshot.projects) {
    if (!listed.has(project._id)) continue;
    const rawShare = project.share ? shares.get(project.share) : undefined;
    const share: ShareRecord | null =
      rawShare && rawShare.project === project._id
        ? {
            _id: rawShare._id,
            url: rawShare.url,
            canEdit: rawShare.canEdit ?? true,
            passwordHash: rawShare.password ?? "",
            ...stamps(rawShare),
          }
        : null;
    if (share) usedShares.add(share._id);
    projectRecords.push({
      _id: project._id,
      ownerId: project.user,
      title: project.title,
      ...(project.src != null && { src: project.src }),
      share,
      ...stamps(project),
    });

    for (const noteId of project.notes ?? []) {
      const note = notes.get(noteId);
      if (!note) {
        skipped.noteRefsDangling++;
        continue;
      }
      if (claimedNotes.has(noteId)) {
        skipped.notesListedTwice.push(noteId);
        continue;
      }
      claimedNotes.add(noteId);
      if (note.project && note.project !== project._id) skipped.notesListedElsewhere.push(noteId);
      const authorKnown = note.user ? users.has(note.user) : false;
      if (note.user && !authorKnown) skipped.noteAuthorsMissing++;
      noteRecords.push({
        _id: note._id,
        projectId: project._id,
        content: note.content,
        time: note.time ?? 0,
        done: note.done ?? false,
        ...(authorKnown && { authorId: note.user! }),
        ...stamps(note),
      });
    }
  }
  for (const note of snapshot.notes) {
    if (!claimedNotes.has(note._id)) skipped.notesNotListed.push(note._id);
  }
  for (const share of snapshot.shares) {
    if (!usedShares.has(share._id)) skipped.sharesNotLinked.push(share._id);
  }

  report.users = userRecords.length;
  report.projects = projectRecords.length;
  report.notes = noteRecords.length;
  report.shares = usedShares.size;
  report.settings = usedSettings.size;
  return { users: userRecords, projects: projectRecords, notes: noteRecords, report };
};

/** Every item the table should hold for these records, claims included. */
export const toItems = ({
  users,
  projects,
  notes,
}: Pick<ReturnType<typeof toRecords>, "users" | "projects" | "notes">) => [
  ...users.flatMap((user) => [items.user(user), items.emailClaim(user)]),
  ...projects.flatMap((project) => [
    items.project(project),
    ...(project.share ? [items.shareClaim(project._id, project.share)] : []),
  ]),
  ...notes.flatMap((note) => [items.note(note), items.noteClaim(note)]),
];
