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
A 30 minute JWT whose subject (`sub`) is the `User._id` as a string and whose
audience is `session`, minted by `generateAccessToken` in `utils/jwt.ts` and
only through the **Identity intake** and the auth wrappers.
`authenticateToken` rejects another audience (so a **Share token** is never
a session) and a payload without a non-empty string `sub`, so such a token
is a 401 and the user logs in again. The client never decodes it.

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
`urlTaken` / `invalid`) with no HTTP; an `ok` carries the
**Owner projection**; `pages/api/project.ts` maps them to
200, 404, 409 and 400. A malformed or missing project id is `notFound`.
Create needs a non-empty `title` (`invalid`, reason `title`). Create and
update write `title` and `src` only. Sharing needs a `share` object and
unsharing one whose `_id` is a hex ObjectId string (`invalid`, reason
`share`). Sharing delegates to the **Share intake**.

**Owner projection**:
`toOwnerProject` in `utils/project/ownerProject.ts`, the one shape an owner
receives their **Project** in, from `/api/auth`, `/api/project` and the
**Share intake**. Notes go through `toPublicNote` (authors with their
**Author role**, never an email) and the **Share** is `{ _id, url, canEdit,
hasPassword }`, never the password hash. Notes and Share not populated (the
create, update and remove replies) are sent as ids. `src` is `""` when the
Project has no video yet.

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
create-vs-update by `projectDoc.share`, writes only `url`, `password` and
`canEdit` from the caller (`project` and `user` come from the Project), hashes
the password (via
`hashSharePassword`), and surfaces a duplicate `url` as `ShareUrlTakenError`
on create and update alike.
An absent `password` keeps the current one and an empty one removes it.
Both operations return the project re-loaded through `findProjectWithRelations`
in the **Owner projection**. `Share.password` is not selected by default;
the code that needs the hash (Share access, `mayEditViaShare`, the populate
spec for `hasPassword`) asks for `+password`. Handlers no longer reach
into `Share.findById` / `Share.create` / `Share.deleteOne` directly.

**Share access**:
`utils/share/shareAccess.ts`, the read side of a **Share**.
`openSharedProject(shareUrl, password)` returns `notFound` |
`passwordRequired` | `incorrect` | `ok(project, shareToken?)`, with a
**Share token** only for a password-protected Share; a Share whose Project is
gone (or no longer points back at it) is `notFound`. The `ok` project is the
**public projection**: title, src, Share `_id`/`url`/`canEdit`, and Notes
whose author appears as `{ _id, username, role }` only (`toPublicNote` /
`toPublicAuthor`). No Share password, no email; an author whose username is
missing or is their email appears without it. `mayEditViaShare(project, shareToken)`
is the one "may edit via Share" check, returning `allowed` | `forbidden` |
`passwordRequired`: the Project's own Share exists and has `canEdit` (read
live on every write), and a password-protected Share also needs a valid
**Share token**; an open Share needs none. `pages/api/public_project.ts` only
maps outcomes to status codes: 401 `passwordRequired`, 403 `incorrect`, 404
`notFound`, 200 `ok` (the reply carries `shareToken` when there is one).

**Author role**:
Computed in one place, `toPublicAuthor(user, ownerId)`: `owner` for the
Project's **User**, `member` for any other **User**. A **Note** with no
author is a guest's and carries no `user`. Public reads, Note write
responses and the **Owner projection** all use it; the client only reads
the role (`DisplayUser` shows the public username, else the role, else
"guest", and nothing on the viewer's own Notes).

**Share token**:
`utils/share/shareToken.ts`. A 12 hour JWT proving the caller gave a
protected Share's password: subject the Share `_id`, audience `share`, a `v`
claim that is a digest of the stored password hash, signed with a secret
derived from `JWT_TOKEN_SECRET`. A new password or a new Share (unshare and
share again, even at the same url) revokes it. The client sends it in the
`x-share-token` header, never in `Authorization`.

**findProjectWithRelations / findProjectsWithRelations**:
The one populate spec for a hydrated Project in
`utils/project/findProjectWithRelations.ts`: Project + Notes (with each
Note's author User) + Share (with its password hash, for `hasPassword`),
for one Project or every match of a query. Its result goes to a client only
through a projection.
The single form is used by the Project intake, the Share intake and the
Share access module. `pages/api/auth.js` loads a User's Projects with the
many form in one query, filtered to `_id` in `User.projects` and owned by
the caller, keeps the `User.projects` order and sends each in the
**Owner projection**.

### Architecture (Note seam)

**Note intake**:
The pair `upsertNote` / `removeDoneProjectNotes` in
`utils/note/noteIntake.ts` that owns the Project↔Note lifecycle and the
**Note write policy** on the write path. Both take the caller's
`User._id` as a string, or `null` for a guest, plus the `x-share-token`
header, and return `ok` | `invalid` | `notFound` | `forbidden` |
`sharePasswordRequired`, which `pages/api/note.ts` maps to HTTP 200, 400,
404, 403 and 403 with `code: "sharePasswordRequired"`. `invalid` is a Note or Project id that is not a hex
ObjectId string (a missing Project id too), or a field the Note schema would
reject: `content` must be a non-empty string (required on create), `time` a
finite number, `done` a boolean. A missing or null `time` or `done` is not
`invalid`: `time` is 0 and `done` false on create, and either is left
unchanged on update (legacy Notes may store a null `done`). It is checked
before the permission check.
`upsertNote` decides create-vs-update by `Note.findById(input._id)`; a
missing id creates.
On update only `content`, `time` and `done` change; `project` and `user`
are fixed. On create the caller becomes the author and the new id is pushed
onto `Project.notes`. The returned Note's author goes through
`toPublicAuthor`, so a write never returns an email. `removeDoneProjectNotes` deletes the done Notes, pulls
their ids from `Project.notes` and returns the survivors, authors the same way.

**Note write policy**:
The Project owner may always write Notes, with no **Share token**; anyone
else (guest or another User) only when `mayEditViaShare` allows it. For an existing Note the
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
read from the public route's status (its `ok` carries the **Share token**
when there is one). `saveNote` and `removeDoneNotes` take an optional
**Share token**, sent as `x-share-token`, and add `sharePasswordRequired`
(a 403 whose body has `code: "sharePasswordRequired"`), and `removeAccount` adds `wrongPassword`
(a 401 whose msg is the wrong-password one) so an expired session still reads
as `unauthorized`. The **SessionStore** it takes is the only
code that touches the token cookie: `browserSession` reads, writes and removes
it; `requestSession(cookieHeader)` reads a request's cookie on the server and
never writes. `browserApi` is the client the browser uses; the **Session
context**, the login pages and `getInitialProps` call it instead of `fetch`.

### Architecture (Client state)

**AppProviders**:
`src/context/appProviders.tsx`, the provider stack the app pages mount, in
dependency order: UI shell, Session, Projects, Shared-project access. It
hands the page's server data over once: a **Share** to the Shared-project
access, otherwise the account to the Session and its **Projects** to the
Projects context. It takes an optional `api` and `sessionStore`, which
default to the browser's; tests pass an API client over a fake `fetch`.

**UI shell context**:
`src/context/uiShellContext.tsx`. Sidebar, menu, open modals, the confirm
prompt and the action input ref. No server calls.

**Session context**:
`src/context/sessionContext.tsx`. The signed-in **User**, `admin` (false for
a guest), **Settings** (missing or null keys fall back to
`SETTINGS_DEFAULTS`), `updateUser`, `updateSettings` (signed-in only),
`removeAccount`, and the **API client** the other contexts call through.
`reportFailure` owns session expiry: an `unauthorized` result sends the
user to `/login`, any other failure is shown as an alert.

**Projects context**:
`src/context/projectsContext.tsx`. The **Projects** on screen, the current
one, and the owner's create, load, update, remove, share and unshare calls.
An update takes only `title` and `src` from its reply, keeping the loaded
Notes and Share.
The Share modal reads `hasPassword`: an empty password field sends no
`password` (kept), its remove control sends `""`, a typed value sets it.
A typed url is lowercased, each run of whitespace becomes `-`, any other
character outside `a-z0-9_-` is dropped and repeated dashes become one.
The link it shows and copies encodes the url.

**Shared-project access context**:
`src/context/sharedProjectContext.tsx`. Opens a public **Share**
(prompting for its password and retrying with the decoded url from the page
path; a pending retry is cancelled on unmount), holds the **Share token** it
hands out in memory (`shareToken()`), `renewShareAccess()` to ask for the
password again when a Note write is refused for it (the project stays on
screen; it resolves `false` if the prompt is dismissed), and `checkCanEdit`, the one canEdit source: a signed-in User on
their own Projects may always edit, a guest only when the **Share** has
`canEdit`. A viewer who cannot edit gets a "View only" hint in place of the
note input and cannot open a Note for editing.

**Video context**:
`src/context/videoContext.tsx`. The player state and the URL it plays. A
playback error never clears a stored web `src` (another browser may play
it): it shows a warning with a codec hint and a local-file picker, and a
picked file plays for this session only, never saved. Only a stored `blob:`
`src` (a local file from an earlier session) is cleared.

**Note context**:
`src/context/noteContext.tsx`. The current Project's **Notes**, search and
proximity, and the note transport: every **Note** write goes through the
Session's API client from here, with the **Share token**. A write refused
with `sharePasswordRequired` keeps its Note, waits on `renewShareAccess`
and is sent again; a dismissed prompt fails it with an alert. Writes to one
Note go out one at a time, so its create lands before its updates, and a
Note whose create failed sends nothing more. A new Note always has a
numeric `time`: its own, else the player position, else 0. The Notes held
here are the last saved ones: a rejected update puts the saved Note back
and its row shows it again. A row sends whatever differs from what it last
sent, and takes the saved Note only once none of its saves is in flight. The note editor never sends empty or blank
`content`; the saved content comes back instead.

`HINTS` and `SETTINGS_DEFAULTS` live in `src/components/shared/constants.ts`;
`copyToClipboard` is in `utils/clientHelpers.ts`.

## Relationships

- A **User** owns many **Projects**; a **Project** has one **User**.
- A **Project** has many **Notes**; a **Note** belongs to one **Project**.
- A **Project** may have one **Share**; a **Share** belongs to one **Project**.
- A guest (no JWT) or another **User** can create, edit and clear done
  **Notes** on a shared **Project** only when the **Share** has
  `canEdit: true` and, if it has a password, with a **Share token**. A guest
  never owns a **User**.

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
