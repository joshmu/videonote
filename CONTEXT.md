# VideoNote

A video review app where a **User** owns **Projects**, each containing
timestamped **Notes**, and can publish a project as a **Share** so others
can read or contribute via a public URL.

## Language

### Domain

**User**:
A registered account with credentials and personal **Settings**.
_Avoid_: account, member.

**Project**:
A video plus the **Notes** taken against it. Owned by exactly one **User**.
_Avoid_: video, board.

**Note**:
A timestamped comment attached to a **Project**. Has `content`, `time`,
`done`, optional author **User**.
_Avoid_: comment, marker.

**Share**:
A publishing record that exposes a **Project** at a public URL with optional
password protection and an `canEdit` flag. One **Project** has at most one
**Share**.
_Avoid_: link, public link.

**Settings**:
Per-user playback and UI preferences (e.g. `playOffset`, `seekJump`,
`sidebarWidth`, `currentProject`).

### Architecture (Database)

**Model module**:
`utils/mongoose.ts`. Holds the schemas, the models (`User`, `Project`,
`Note`, `Settings`, `Share`) and the Doc types inferred from them
(`UserDoc`, `ProjectDoc`, `NoteDoc`, `SettingsDoc`, `ShareDoc`). Importing it
opens no connection. Server code takes Doc types from here;
`src/components/shared/types.ts` holds only client/wire types.

**connectDb**:
The one way to open the database, exported by the model module. Reuses the
pending or open connection and retries after a failed attempt. Called by
`withAuthenticatedUser` / `withOptionalUser` and by each unwrapped
`pages/api` handler that touches the database.

**Test database harness**:
Server tests (the `server` vitest project, `node` environment) share one
in-memory mongod started by `src/__test__/db/globalSetup.ts`, which pins
`MONGOMS_VERSION`. A test file calls `useTestDb()` (`src/__test__/db/testDb.ts`)
to get its own database, opened through `connectDb`, emptied after each test.
The mongod download is the only network access.

### Architecture (Identity / Auth seam)

**AuthContext**:
The bag passed into every handler wrapped by `withAuthenticatedUser`:
`{ userDoc, email, newToken }`. The `newToken` is already rotated; handlers
just echo it back to the client.

**OptionalAuthContext**:
The discriminated bag for `withOptionalUser`. Either `{ isGuest: true,
userDoc: null, email: null, newToken: null }` or the same shape as
`AuthContext` with `isGuest: false`.

**withAuthenticatedUser**:
The wrapper that owns the JWT-extraction → verify → user-lookup contract.
Lives in `utils/auth/withAuthenticatedUser.ts`. Handlers never read
`req.headers["authorization"]` directly. A missing or invalid token is
answered with 401 before `connectDb` runs, so a database outage cannot
turn it into a 500.

**withOptionalUser**:
Same wrapper for routes that allow guests (currently only `pages/api/note.ts`).
A _missing_ token routes to the guest branch; a _present-but-invalid_ token
still 401s — there is no silent fallback.

**Identity intake**:
`register` / `authenticate` / `updateProfile` / `removeAccount` in
`utils/user/identityIntake.ts`, the only writer of **User** documents.
Each returns a discriminated outcome (`ok` / `invalid` / `emailTaken` /
`notFound` / `wrongPassword`) and does no HTTP; `pages/api/login.js`,
`register.js` and `user.js` map outcomes to status codes. Credentials must
be non-empty strings. A taken email is detected from the unique index
(E11000), never by check-then-save. `updateProfile` writes `username` and
`email` only and returns a token minted for the saved email, so an email
change keeps the session. `removeAccount` checks the password, removes owned
**Projects** through the **Project intake**, then the user's other
**Notes**, **Shares** and **Settings**, and the **User** last. **Settings**
are written only through `/api/settings`, which takes `currentProject`,
`playOffset`, `showHints`, `seekJump` and `sidebarWidth` from the body.

### Architecture (Project seam)

**Project intake**:
`createProject` / `getProject` / `updateProject` / `shareProject` /
`unshareProject` / `removeProject` / `removeUserProjects` in
`utils/project/projectIntake.ts`. Every operation is scoped to the owning
**User** and returns a discriminated outcome (`ok` / `notFound` /
`urlTaken` / `invalid`) with no HTTP; `pages/api/project.ts` maps them to
200, 404, 409 and 400. A malformed or missing project id is `notFound`.
Create needs a non-empty `title`. Create and update write `title` and
`src` only. Sharing delegates to the **Share intake**.

**Project cascade**:
The one removal path, used by `removeProject` and (through
`removeUserProjects`) by account removal: the Project's **Notes** (via the
`Note` model), its **Share**, the owner's `User.projects` ref, then the
**Project**. Every step is a no-op when already done and the Project goes
last, so a failed cascade throws with the Project still findable and a
re-run finishes it.

### Architecture (Share seam)

**ShareAccessResult**:
The discriminated outcome returned by `verifySharePassword`:
`open` | `passwordRequired` | `incorrect` | `ok`. Lets the read path map
each case to a response without branching on string messages.

**verifySharePassword / hashSharePassword**:
The pure pair in `utils/share/sharePassword.ts` that owns the password
contract for shares. Both treat empty/null as "no password protection".

**Share intake**:
The pair `attachOrUpdateShare` / `detachShare` in `utils/share/shareIntake.ts`
that owns the Project↔Share lifecycle. `attachOrUpdateShare` decides
create-vs-update by `projectDoc.share`, hashes the password (via
`hashSharePassword`), and surfaces a duplicate `url` as `ShareUrlTakenError`.
Both operations return the project re-loaded through `findProjectWithRelations`
so callers can hand it straight back to the client. Handlers no longer reach
into `Share.findById` / `Share.create` / `Share.deleteOne` directly.

**findProjectWithRelations**:
The populate spec for a hydrated Project in
`utils/project/findProjectWithRelations.ts`: Project + Notes (with each
Note's author User) + Share. Used by `pages/api/project.ts` (GET, SHARE,
REMOVE_SHARE) and the Share intake module. `pages/api/auth.js` and
`pages/api/public_project.ts` still hand-roll the same populate; folding
them into this helper is a clean follow-up.

### Architecture (Note seam)

**Note intake**:
The pair `upsertNote` / `removeDoneProjectNotes` in
`utils/note/noteIntake.ts` that owns the Project↔Note lifecycle on the
write path. `upsertNote` decides create-vs-update by
`Note.findById(input._id)`; on create it pushes the new id onto
`Project.notes` and returns the Note re-loaded with its author User
populated. The intake takes a pre-resolved `authorId: string | null` so
guests skip authorship without the module knowing about
`OptionalAuthContext`. `removeDoneProjectNotes` deletes every done Note
in a project and returns the survivors. Handlers no longer reach into
`Note.findById`, `new Note()`, `Project.findById().notes.push(...)`, or
`Note.deleteMany` directly.

**extractAuthorId**:
The one-line helper in `utils/auth/withAuthenticatedUser.ts` that pulls
`User._id` as a string (or `null`) out of an `OptionalAuthContext`.

## Relationships

- A **User** owns many **Projects**; a **Project** has one **User**.
- A **Project** has many **Notes**; a **Note** belongs to one **Project**.
- A **Project** may have one **Share**; a **Share** belongs to one **Project**.
- A guest (no JWT) can create a **Note** against a shared **Project** when the
  **Share** has `canEdit: true`. They never own a **User**.

## Example dialogue

> **Dev:** "When a guest hits `/api/note` to add a **Note**, who's recorded
> as the author?"
> **Domain:** "Nobody. The **Note** persists with `user` undefined. The
> wrapper signals guest mode via `ctx.isGuest === true`, and the handler
> skips the `user` assignment."

> **Dev:** "If a **Share** has no password, what does
> `verifySharePassword` return?"
> **Domain:** "`{ kind: 'open' }`. The same shape whether `storedHash` is
> `null`, `undefined`, or `""` — those all mean unprotected. That's why the
> public read path no longer crashes on the legacy null case."

## Known follow-ups

These are deliberately out of scope for the current change but worth
re-suggesting in a future architecture review:

- **public_project status codes**: `passwordRequired` and `incorrect`
  currently respond with HTTP 200 + `msg` because the existing client at
  `src/context/globalContext.tsx` keys off `data.msg` rather than
  `res.status`. Migrating both server and client to 401/403 would let
  generic HTTP middleware handle these cases.
- **`globalContext.tsx` god-object**: 792 LOC, 28 exposed properties; a
  separate review should consider splitting it along the same seam lines
  used for the API (Identity, Project, Note, Share).
