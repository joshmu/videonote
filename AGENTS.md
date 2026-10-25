# AGENTS.md

VideoNote: a video review app where Users take timestamped Notes on Projects
and publish them as Shares. Next.js (pages router) on Vercel, functions pinned
to `syd1`.

## Read first

- [`CONTEXT.md`](CONTEXT.md): domain language and architecture seams. Use its
  terms in code, tests and docs.
- [`docs/`](docs/README.md): plans and architecture decision records. The
  data lives in DynamoDB (one table per environment, see
  [`docs/adr/0001-dynamodb-single-table.md`](docs/adr/0001-dynamodb-single-table.md)).
- [`docs/observability.md`](docs/observability.md): Sentry, `/api/health`
  and the prod alarms. Routes that catch an error and answer it themselves
  call `reportError` so it still reaches Sentry.

## Commands

```bash
pnpm db:up          # DynamoDB Local in Docker (data kept in a volume) + the videonote-local table
pnpm db:seed        # made-up demo data through the running app's API
pnpm dev:aws        # dev server on the videonote-dev table (AWS_PROFILE=personal)
pnpm dev            # dev server on DynamoDB Local (needs .env.local for JWT_TOKEN_SECRET)
pnpm test           # unit, server and Store contract tests (DynamoDB Local)
pnpm test:e2e       # production build + Playwright user flows on a throwaway database
pnpm typecheck
pnpm lint           # oxlint
pnpm format         # oxfmt
```

Tests and `db:up` need Docker. `pnpm test:e2e` also needs `ffmpeg` (it
generates the test video) and Playwright's Chromium
(`pnpm exec playwright install chromium`). Infrastructure lives in `infra/`
(see its README).

## Tests

- `src/__test__/`: unit and server tests. Server suites get a fresh Store on
  its own DynamoDB Local table from `useTestStore(backend)` and seed and assert
  through it; `getStore()` returns the test's Store.
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

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
