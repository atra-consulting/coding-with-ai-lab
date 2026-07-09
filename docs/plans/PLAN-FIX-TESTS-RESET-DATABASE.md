# Implementation Plan: FIX-TESTS-RESET-DATABASE

## Test Command
`cd backend && npm test`

## Problem

Backend Playwright tests reset the **dev** database.

- `backend/src/config/db.ts` hardcodes the SQLite file to `crmdb.sqlite` — the same file dev uses.
- `npm test` runs `playwright.config.ts` → `globalSetup.ts` spawns a backend with `NODE_ENV=test`.
- But `db.ts` ignores `NODE_ENV`, so the test backend opens `crmdb.sqlite`.
- `tickets.spec.ts` calls `POST /api/tickets/reset`. CRM suites reload `fixture.json`. Both wipe/mutate the dev DB.

Proof: after a test run, dev ticket 13 is gone (404) and CRM entities revert to seed.

## Fix

Give the test backend its own SQLite file. Never touch `crmdb.sqlite`.

Turso stays untouched: when `TURSO_DATABASE_URL` is set (CI), that path wins — no change there.

## Tasks

### 1. Isolate the test DB file (`backend/src/config/db.ts`)
- [ ] When `TURSO_DATABASE_URL` is unset AND `NODE_ENV === 'test'`, use `crmdb.test.sqlite` instead of `crmdb.sqlite`.
- [ ] Keep Turso precedence unchanged. Keep the `mkdirSync(dataDir)` guard.
- [ ] Local dev (no NODE_ENV=test) keeps using `crmdb.sqlite`.

### 2. Fresh, seeded test DB each run (`backend/src/test/globalSetup.ts`)
- [ ] Before spawning the backend, delete `crmdb.test.sqlite` and its `-wal` / `-shm` sidecar files (best-effort, ignore if missing).
- [ ] Result: every `npm test` run starts from a fresh DB. Startup re-creates schema, seeds agent-tasks (ids 1–23), loads `fixture.json` CRM entities, and seeds the 12 workshop tickets — deterministic state, no accumulated cruft.
- [ ] Do not delete `crmdb.sqlite`.

### 3. Gitignore check
- [ ] Confirm `crmdb.test.sqlite` is ignored. Root `.gitignore` already ignores `data/`, which covers `backend/data/`. No change expected.

### 4. Verification
- [ ] Capture SHA-256 of `backend/data/crmdb.sqlite` before running tests.
- [ ] Run `cd backend && npm test`.
- [ ] Confirm the suite passes (same as before).
- [ ] Confirm `backend/data/crmdb.sqlite` SHA-256 is **unchanged** — dev DB untouched.
- [ ] Confirm `backend/data/crmdb.test.sqlite` now exists.

## Tests

No new spec files. The existing suite is the regression test — it must still pass against the isolated DB.

### Verification checks (manual, in Step 9)
- [ ] Dev DB hash identical before/after a full test run.
- [ ] Test DB file created separately.
- [ ] Full backend suite green.

## Out of Scope / Caveat
- ###### `playwright.test.config.ts` (skips `globalSetup`, assumes a backend already running) is a manual dev config. If a dev points it at a running **dev** backend, tests hit the dev DB — because that backend runs without `NODE_ENV=test`. The default `npm test` path is fully fixed. Documented, not changed.
