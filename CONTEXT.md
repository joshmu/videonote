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

**Session token**:
A 30 minute JWT whose subject (`sub`) is the `User._id` as a string, minted
by `generateAccessToken` in `utils/jwt.ts` and only through the **Identity
intake** and the auth wrappers. `authenticateToken` rejects a payload
without a non-empty string `sub`, so a token without one is a 401 and the
user logs in again. The client never decodes it.

**withAuthenticatedUser**:
The wrapper that owns the JWT-extraction → verify → user-lookup contract.
Lives in `utils/auth/withAuthenticatedUser.ts`. The **User** is looked up by
the **Session token** subject. Handlers never read
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
`email` only and returns a fresh **Session token**; its subject is the
`User._id`, so an email change keeps the session. `removeAccount` checks the password, removes owned
**Projects** through the **Project intake**, unsets the author on the user's
**Notes** on other owners' **Projects** (they read as a guest's), removes
**Shares** and **Settings**, and the **User** last. **Settings**
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

**Share access**:
`utils/share/shareAccess.ts`, the read side of a **Share**.
`openSharedProject(shareUrl, password)` returns `notFound` |
`passwordRequired` | `incorrect` | `ok(project)`; a Share whose Project is
gone (or no longer points back at it) is `notFound`. The `ok` project is the
**public projection**: title, src, Share `_id`/`url`/`canEdit`, and Notes
whose author appears as `{ _id, username }` only (`toPublicAuthor`). No Share password, no email; an
author whose username is missing or is their email appears as `{ _id }`. `mayEditViaShare(project)`
is the one "may edit via Share" check: the Project's own Share exists and has
`canEdit`. `pages/api/public_project.ts` only maps outcomes to status codes:
401 `passwordRequired`, 403 `incorrect`, 404 `notFound`, 200 `ok`.

**findProjectWithRelations / findProjectsWithRelations**:
The one populate spec for a hydrated Project in
`utils/project/findProjectWithRelations.ts`: Project + Notes (with each
Note's author User) + Share, for one Project or every match of a query.
The single form is used by the Project intake, the Share intake and the
Share access module. `pages/api/auth.js` loads a User's Projects with the
many form in one query, filtered to `_id` in `User.projects` and owned by
the caller, and keeps the `User.projects` order.

### Architecture (Note seam)

**Note intake**:
The pair `upsertNote` / `removeDoneProjectNotes` in
`utils/note/noteIntake.ts` that owns the Project↔Note lifecycle and the
**Note write policy** on the write path. Both take the caller's
`User._id` as a string, or `null` for a guest, and return `ok` |
`invalid` | `notFound` | `forbidden`, which `pages/api/note.ts` maps to HTTP
200, 400, 404 and 403. `invalid` is a malformed Note id, or a malformed or
missing Project id, caught before any lookup. `upsertNote` decides
create-vs-update by `Note.findById(input._id)`; a missing id creates.
On update only `content`, `time` and `done` change; `project` and `user`
are fixed. On create the caller becomes the author and the new id is pushed
onto `Project.notes`. The returned Note's author goes through
`toPublicAuthor`, so a write never returns an email. `removeDoneProjectNotes` deletes the done Notes, pulls
their ids from `Project.notes` and returns the survivors.

**Note write policy**:
The Project owner may always write Notes; anyone else (guest or another
User) only when `mayEditViaShare` allows it. For an existing Note the
Project is the stored Note's, never the payload's. A missing Project is
`notFound` and nothing is saved.

**extractAuthorId**:
The one-line helper in `utils/auth/withAuthenticatedUser.ts` that pulls
`User._id` as a string (or `null`) out of an `OptionalAuthContext`.

### Architecture (Client transport)

**API client**:
`utils/apiClient.ts`, no React. `createApiClient({ fetch, session, origin })`
takes `fetch` as a parameter and exposes one typed call per route, each
returning `ok` | `unauthorized` (401) | `error` (other failures, non-JSON
bodies, network errors). `openShare` instead returns the Share access outcome
read from the public route's status, and `removeAccount` adds `wrongPassword`
(a 401 whose msg is the wrong-password one) so an expired session still reads
as `unauthorized`. The **SessionStore** it takes is the only
code that touches the token cookie: `browserSession` reads, writes and removes
it; `requestSession(cookieHeader)` reads a request's cookie on the server and
never writes. `browserApi` is the client the browser uses; `globalContext`,
the login pages and `getInitialProps` call it instead of `fetch`.

## Relationships

- A **User** owns many **Projects**; a **Project** has one **User**.
- A **Project** has many **Notes**; a **Note** belongs to one **Project**.
- A **Project** may have one **Share**; a **Share** belongs to one **Project**.
- A guest (no JWT) or another **User** can create, edit and clear done
  **Notes** on a shared **Project** only when the **Share** has
  `canEdit: true`. A guest never owns a **User**.

## Example dialogue

> **Dev:** "When a guest hits `/api/note` to add a **Note**, who's recorded
> as the author?"
> **Domain:** "Nobody, and only if the **Share** has `canEdit`. The wrapper
> signals guest mode via `ctx.isGuest === true`, the handler passes a `null`
> caller, and the Note intake saves the **Note** with `user` undefined, even
> if the payload names a `user`."

> **Dev:** "If a **Share** has no password, what does
> `verifySharePassword` return?"
> **Domain:** "`{ kind: 'open' }`. The same shape whether `storedHash` is
> `null`, `undefined`, or `""` — those all mean unprotected. That's why the
> public read path no longer crashes on the legacy null case."

## Known follow-ups

These are deliberately out of scope for the current change but worth
re-suggesting in a future architecture review:

- **Share password on Note writes** (#115): the Note write policy checks
  only `canEdit`; the Share password gates reading. Any proof of the
  password on writes belongs in `mayEditViaShare`.
- **`globalContext.tsx` god-object**: 792 LOC, 28 exposed properties; a
  separate review should consider splitting it along the same seam lines
  used for the API (Identity, Project, Note, Share).
