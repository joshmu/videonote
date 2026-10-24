---
name: e2e
description: Run, write and debug VideoNote's end-to-end suite (Playwright API flows and browser journeys against a production build). Use when adding or changing a user flow, when e2e fails in CI, or to prove a change works end to end.
---

# VideoNote e2e

## Run

```bash
pnpm test:e2e                                  # build, then every spec
pnpm exec playwright test --project=api        # API flows only (reuses a running server)
pnpm exec playwright test e2e/browser -g share # one journey by title
pnpm exec playwright test --repeat-each=3      # flake check before pushing
```

`playwright.config.ts` starts `node e2e/server.mjs`: the existing `.next`
build on port 3977 against a throwaway in-memory mongod. Locally a server
already on 3977 is reused, so rebuild (`pnpm build`) and restart it after
changing app code. Browse it at `http://localhost:3977`, not `127.0.0.1`.

## Write

- **API flows** (`e2e/api/`): use `registeredUser()` / `newClient()` from
  `e2e/support/api.ts` and the app's `createApiClient`. Every test makes its
  own Users and Share urls (`randomUUID`), so tests stay parallel and
  independent. Assert on outcomes (`kind`, `status`) and on what a later read
  returns, not on internal fields.
- **Browser journeys** (`e2e/browser/`): import `test`, `expect` and
  `VIDEO_URL` from `e2e/support/browser.ts`. Any Project you create must use
  `VIDEO_URL`, or the player never loads and the note input never shows. Set up
  state through the API helpers and drive only the journey under test in the
  browser.
- Selectors: role or label first. The menu icon, its first-use items and modal
  buttons animate forever, so use `dispatchEvent("click")` for them (see
  `openMenu`). Prefer adding an `aria-label` over a CSS selector.
- A Note shows in the list before its save lands: poll the API
  (`expect.poll`) when asserting persistence.

## Debug

- Failures keep a trace: `pnpm exec playwright show-trace test-results/<test>/trace.zip`.
  `error-context.md` beside it holds the page snapshot at failure.
- In CI the traces are uploaded as the `playwright-traces` artifact.
