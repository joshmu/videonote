# AGENTS.md

VideoNote: a video review app where Users take timestamped Notes on Projects
and publish them as Shares. Next.js (pages router) on Vercel, functions pinned
to `syd1`.

## Read first

- [`CONTEXT.md`](CONTEXT.md): domain language and architecture seams. Use its
  terms in code, tests and docs.
- [`docs/`](docs/README.md): plans and architecture decision records. The
  MongoDB → DynamoDB migration is in progress:
  [`docs/plans/dynamodb-migration.md`](docs/plans/dynamodb-migration.md).

## Commands

```bash
pnpm dev            # dev server (needs .env.local, see .env.example)
pnpm test           # unit + server tests (vitest, in-memory mongod)
pnpm test:e2e       # production build + Playwright user flows on a throwaway database
pnpm typecheck
pnpm lint           # oxlint
pnpm format         # oxfmt
```

`pnpm test:e2e` needs `ffmpeg` (it generates the test video) and Playwright's
Chromium (`pnpm exec playwright install chromium`).

## Tests

- `src/__test__/`: unit and server tests. Server tests get their own database
  from `useTestDb()`.
- `e2e/api/`: every API flow through the real routes, using the app's own
  `createApiClient`. Each test registers its own Users, so tests run in
  parallel.
- `e2e/browser/`: the main user journeys in Chromium. Videos point at
  `VIDEO_URL`, which serves a generated clip.
- Behaviour changes need a test at the lowest level that shows them; changes
  to a user flow need an e2e test.

## Conventions

- pnpm. Commits follow commitlint: `type(scope): description`.
- CI (`.github/workflows/ci.yml`) runs format, lint, typecheck, tests, e2e,
  gitleaks and audit on every PR.
- Never commit secrets or user data. The repo is public.
- Keep binary assets out of git; tests generate what they need.

## Skills

`.claude/skills/`: `verify` (drive the app locally), `e2e` (run, write and
debug the user-flow suite), `tdd`, `improve-codebase-architecture`.
