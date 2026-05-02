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
`req.headers["authorization"]` directly.

**withOptionalUser**:
Same wrapper for routes that allow guests (currently only `pages/api/note.ts`).
A _missing_ token routes to the guest branch; a _present-but-invalid_ token
still 401s — there is no silent fallback.

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
- **Mongoose `Document.remove()` deprecation**: `pages/api/user.js` calls
  `userDoc.remove()` (legacy API) and `projectDoc.remove()` for project
  cleanup. Both should be replaced with `deleteOne()` to align with the
  bundled Mongoose version.
- **`utils/apiHelpers.ts` field names**: the helpers strip `created` and
  `updated` from documents but the Mongoose schemas use `createdAt` /
  `updatedAt` (timestamps option). The strip currently does nothing.
- **`globalContext.tsx` god-object**: 792 LOC, 28 exposed properties; a
  separate review should consider splitting it along the same seam lines
  used for the API (Identity, Project, Note, Share).
- **`pages/api/note.ts` action dispatch**: a single handler with both an
  upsert path (no `action`) and a `REMOVE_DONE_NOTES` branch makes the
  intake hard to test without exercising the whole route. The Share-seam
  refactor in `pages/api/project.ts` is the template — extract a Note
  intake module along the same lines.
