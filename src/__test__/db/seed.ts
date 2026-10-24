import bcrypt from "bcryptjs";

import type { Id, NoteRecord, ProjectRecord, Store, UserRecord } from "@/utils/store/types";

let counter = 0;

/**
 * A new id in the ObjectId format that sorts after every id this file made
 * before it, so records seeded in order read back in that order on every
 * backend (a DynamoDB Project lists its Notes by id).
 */
export const testId = (): Id =>
  Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, "0") + (counter++).toString(16).padStart(16, "0");

/** Records sorted by id, for comparing lists whose order is not the behaviour under test. */
export const sortById = <T extends { _id: Id }>(list: T[]): T[] =>
  [...list].sort((a, b) => (a._id < b._id ? -1 : a._id > b._id ? 1 : 0));

/** A User through the Store. The username defaults to the email, as registration does. */
export const seedUser = async (
  store: Store,
  email: string,
  { username = email, password }: { username?: string; password?: string } = {},
): Promise<UserRecord> => {
  const user = await store.createUser({
    email,
    username,
    passwordHash: password ? await bcrypt.hash(password, 4) : "",
  });
  if (user === "emailTaken") throw new Error(`Test email ${email} is taken`);
  return user;
};

/** A Project at the end of its owner's list. */
export const seedProject = (
  store: Store,
  ownerId: Id,
  { title = "Rough cut", src }: { title?: string; src?: string } = {},
): Promise<ProjectRecord> =>
  store.createProject(ownerId, { title, ...(src !== undefined && { src }) });

/** A Note on the Project, a guest's unless `authorId` is given. */
export const seedNote = (
  store: Store,
  projectId: Id,
  {
    content = "Original",
    time = 0,
    done = false,
    authorId,
  }: { content?: string; time?: number; done?: boolean; authorId?: Id } = {},
): Promise<NoteRecord> =>
  store.createNote({
    _id: testId(),
    projectId,
    content,
    time,
    done,
    ...(authorId && { authorId }),
  });
