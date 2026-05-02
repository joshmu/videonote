# VideoNote

A video review app with slick intuitive controls to create timestamped notes on the fly. ✨

## Tech Stack

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [react-intersection-observer](https://github.com/thebuilder/react-intersection-observer)
- [react-icons](https://github.com/react-icons/react-icons)
- [mongoose](https://mongoosejs.com)
- [react-player](https://github.com/CookPete/react-player)
- [nodemailer](https://nodemailer.com)
- [universal-cookie](https://github.com/reactivestack/cookies/tree/master/packages/universal-cookie)
- [nanoid](https://github.com/ai/nanoid)

Some additional experimental features are enabled in `tailwind.config.js`: _uniformColorPalette, extendedSpacingScale, extendedFontSizeScale_

### Setup

- MongoDB database
- SMTP email server
- JWT

Create a `.env.local` based on the `.env.example` for local development.

### Run it

`npm i && npm run dev`

## API conventions

Routes under `pages/api/` use two small higher-order wrappers from
`utils/auth/withAuthenticatedUser.ts` to keep authentication out of the
handler bodies:

- **`withAuthenticatedUser(handler)`** — required for routes that mutate user
  data (`auth`, `user`, `settings`, `project`). The handler receives a third
  `ctx` argument with `{ userDoc, email, newToken }`. Missing/invalid tokens
  short-circuit with 401; missing users short-circuit with 401.
- **`withOptionalUser(handler)`** — used by `pages/api/note.ts`, which allows
  guest note creation. The handler receives a discriminated `ctx`: either
  `{ isGuest: true, ... null }` or the full authenticated context. A token
  that is present but invalid still 401s — there is no silent fallback to the
  guest branch.

Shared-project access goes through `utils/share/sharePassword.ts`:

- **`hashSharePassword(plaintext)`** — used by `pages/api/project.ts` when
  creating or updating a Share document. Returns `null` for empty input.
- **`verifySharePassword(storedHash, candidate)`** — used by
  `pages/api/public_project.ts` when reading a shared project. Returns a
  `ShareAccessResult` discriminated union: `open` | `passwordRequired` |
  `incorrect` | `ok`.

Both modules have unit tests under `src/__test__/` that exercise behaviour
through their public interface.
