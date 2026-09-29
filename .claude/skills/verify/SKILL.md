---
name: verify
description: Build, run and drive VideoNote locally (real MongoDB, production build, headless browser) to verify a change at its surface.
---

# Verify VideoNote locally

## Handle

1. Worktree at the ref under test, `pnpm install --frozen-lockfile`.
2. MongoDB: reuse the mongod binary the test harness caches:
   `~/.cache/mongodb-binaries/mongod-<arch>-<os>-<ver> --dbpath $(mktemp -d) --port 27399 --bind_ip 127.0.0.1`
3. Only two env vars: `MONGODB_URI=mongodb://127.0.0.1:27399/videonote_verify JWT_TOKEN_SECRET=<any>`.
   `pnpm build`, then `pnpm start -p 3977 -H 127.0.0.1` with the same env.
4. Browse via `http://localhost:3977`, NOT `127.0.0.1`: `pages/index.tsx` builds its API origin with next-absolute-url, which picks `https:` for any host other than `localhost`, so `/` fails and bounces to `/login`.

## Drive

- API: POST JSON to `/api/*` (shapes in `utils/apiClient.ts`); `Authorization: Bearer <token>` from `/api/login` (answers 302 with a JSON body; don't follow redirects).
- GUI: any Playwright install (headless Chromium); point `executablePath` at an installed build if the bundled revision is missing.
- Video: a URL the browser can't play (e.g. a fake one) keeps the project `src` and shows a warning with a codec hint and a local-file picker; only a stored `blob:` src is cleared. Serve a real clip: `ffmpeg -f lavfi -i testsrc=duration=60:size=640x360:rate=24 -c:v libvpx clip.webm` and `python3 -m http.server`.
- Menu is the gear SVG top-right (no label); items by text ("create new", "Share Project").
- Share modal: fill password BEFORE url (typing in the password field clears the url).

## Flows worth driving

Register -> create project -> add notes -> reload (persisted); share with password -> guest context `/vn/<url>` (401 prompt, 403 wrong, 200 right) -> guest note on an editable share -> owner reload shows it labelled "guest"; garbage `token` cookie -> `/login`; unknown share -> `/hello`.
