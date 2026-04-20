# Implementation Plan: FIXED-SEED-DATA

**PRD:** `docs/prds/PRD-FIXED-SEED-DATA.md`
**Branch:** `fixed-seed-data`

## Test Commands

- Backend Playwright: `cd backend && npm test` (currently no `playwright.config.ts` and no `backend/src/test/` directory exist — see "Test Harness Gap" below).
- Frontend Karma: `cd frontend && npm test` (not touched in this change — sanity-run only).

### Test Harness Gap

The CLAUDE.md says backend uses Playwright for E2E API tests under `backend/src/test/`. **Verified:** neither the config file nor the directory exists yet. Bootstrapping the Playwright harness (config, `globalSetup` that resets the DB and boots the server, session auth helper, base URL) is a standalone task and out of scope for this PRD. This plan verifies the change via manual smoke tests and direct HTTP queries during implementation. A follow-up PRD should bootstrap the Playwright harness.

## Tasks

### Phase 1 — Create `backend/src/seed/dataMigration.ts`

- [ ] Create `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/backend/src/seed/dataMigration.ts`.
- [ ] Imports:
  - `readFileSync` from `node:fs`
  - `dirname`, `join` from `node:path`
  - `fileURLToPath` from `node:url`
  - `sqlite` from `../config/db.js`
- [ ] Declare `__dirname` via `dirname(fileURLToPath(import.meta.url))`.
- [ ] Copy the `Fixture` interface verbatim from `seeder.ts` (typed keys for all six tables).
- [ ] Copy `INSERT_SQL` record verbatim from `seeder.ts`. All six INSERT statements are kept identical (db-reviewer confirmed all 60 schema columns are covered).
- [ ] Copy `INSERT_ORDER` verbatim: `['firma', 'abteilung', 'person', 'adresse', 'aktivitaet', 'chance']` — FK-safe order.
- [ ] Export `runDataMigration(): void` with this flow:
  1. **Guard first:** query `SELECT COUNT(*) as cnt FROM firma`. If `cnt > 0`, log `=== Seeder: Datenbank enthält bereits ${count} Firmen, übersprungen ===` and return. No file read on this path.
  2. **JSON before transaction:** `JSON.parse(readFileSync(join(__dirname, 'fixture.json'), 'utf8'))` cast to `Fixture`. Throws cleanly if malformed — no DB writes yet.
  3. **Single transaction:** wrap all inserts in `sqlite.transaction(() => { ... })()`. Inside: for each `table` in `INSERT_ORDER`, prepare once and `stmt.run(row)` for each row in `fixture[table]`.
  4. **Completion log:** `=== Seeder: N Firmen, M Abteilungen, ... aus Fixture geladen ===` — exact format from `seeder.ts:59-64`.
- [ ] No `try/catch`. Errors propagate — process crashes, matching `migrate.ts` behavior.
- [ ] Do not add any PRAGMA inside `dataMigration.ts`; the shared `sqlite` singleton from `config/db.ts` already has `foreign_keys = ON` set on the connection.

### Phase 2 — Wire up `backend/src/index.ts`

- [ ] Replace `import { runSeeder } from './seed/seeder.js';` with `import { runDataMigration } from './seed/dataMigration.js';`.
- [ ] Replace the call `runSeeder()` with `runDataMigration()`.
- [ ] Update the adjacent inline comment (if present) to reflect the new function.
- [ ] Result: startup order is `runMigrations()` → `runDataMigration()` → `app.listen(...)`.

### Phase 3 — Automated smoke verification (gate before Phase 4)

**I (Claude) run this directly — wipe DB, start app, verify via browser + SQLite + API.** Claude runs every step. If anything fails, fix and retry.

- [ ] Ensure nothing is running on ports 7070/7200 (`lsof -iTCP:7070 -sTCP:LISTEN` and `lsof -iTCP:7200 -sTCP:LISTEN`).
- [ ] Delete the SQLite file: `rm -f backend/data/crmdb.sqlite`.
- [ ] Start the backend in background: `cd backend && npx tsx src/index.ts` (run_in_background).
- [ ] Capture backend logs and confirm: one `=== Migrationen: ... ===` line, then exactly one `=== Seeder: 25 Firmen, 50 Abteilungen, 100 Personen, 100 Adressen, 75 Aktivitaeten, 40 Chancen aus Fixture geladen ===` line, then `Server läuft auf Port 7070`.
- [ ] Direct DB counts via `sqlite3 backend/data/crmdb.sqlite`: `SELECT COUNT(*) FROM firma; SELECT COUNT(*) FROM abteilung; SELECT COUNT(*) FROM person; SELECT COUNT(*) FROM adresse; SELECT COUNT(*) FROM aktivitaet; SELECT COUNT(*) FROM chance;`. Must be 25/50/100/100/75/40.
- [ ] Start the frontend in background: `cd frontend && npx ng serve --port 7200 --proxy-config proxy.conf.json` (run_in_background). Wait for "Compiled successfully".
- [ ] Use Playwright MCP to navigate to `http://localhost:7200`, log in as `admin/admin123`, open the Firmen list, verify the UI shows 25 Firmen (or matches the total page count for configured page size).
- [ ] Spot-check one firma detail page — FK data (Abteilungen, Personen) renders without errors.
- [ ] Check browser console via `mcp__playwright__browser_console_messages` — no errors.
- [ ] Idempotency: stop the backend (do NOT delete the DB). Start it again. Confirm logs show `... übersprungen ===`. Re-query DB counts — still 25/50/100/100/75/40.
- [ ] Reproducibility: stop everything, `rm -f backend/data/crmdb.sqlite`, restart backend. Confirm the same counts return.
- [ ] Stop all background processes cleanly before proceeding.

### Phase 4 — Delete `backend/src/seed/seeder.ts`

- [ ] Delete `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/backend/src/seed/seeder.ts`.
- [ ] Grep the backend source tree: `runSeeder` and `from './seed/seeder'` must return zero hits.
- [ ] Grep `backend/package.json` for `seeder` and for `build-fixture` — neither should be referenced by any npm script (confirms `build-fixture.ts` is dev-only, not wired into `test`/`start`/etc.).

### Phase 5 — Add dev-tool header to `backend/src/seed/build-fixture.ts`

- [ ] Replace the existing leading comment block with:

  ```
  // DEV TOOL — not called at runtime.
  // Regenerates backend/src/seed/fixture.json after schema changes.
  // Run with: cd backend && npx tsx src/seed/build-fixture.ts
  // The 25 firma addresses are real, geocoded via Nominatim (OpenStreetMap).
  // All other data is deterministically generated via mulberry32(seed=42).
  //
  // When adding a new column or entity: update the Drizzle schema and
  // config/migrate.ts, extend this generator to emit the new column,
  // regenerate fixture.json, and add the column to INSERT_SQL in
  // seed/dataMigration.ts.
  ```

### Phase 6 — Update `CLAUDE.md`

- [ ] Add a brief **Startup flow** note under the `## Build & Run` block:
  ```
  **Startup flow:** `runMigrations()` (DDL) → `runDataMigration()` (loads `backend/src/seed/fixture.json`, skipped if DB already has rows) → server listens on port 7070.
  ```
- [ ] Grep `CLAUDE.md` for `seeder` / `Seeder` — remove or update any stale reference.

## Verification Checklist

- [ ] `backend/src/seed/dataMigration.ts` exists; exports `runDataMigration`.
- [ ] `backend/src/seed/seeder.ts` deleted.
- [ ] `backend/src/seed/build-fixture.ts` has the new dev-tool header.
- [ ] `backend/src/seed/fixture.json` unchanged (no diff vs origin/main).
- [ ] `backend/src/index.ts` imports and calls `runDataMigration`, not `runSeeder`.
- [ ] `grep -r runSeeder backend/src` returns zero matches.
- [ ] `grep -r "seed/seeder" backend/src` returns zero matches.
- [ ] `grep build-fixture backend/package.json` returns zero matches (no script wires it in).
- [ ] Phase 3 automated smoke verification all pass (Claude-run, Playwright MCP + DB inspection).
- [ ] Frontend build still green: `cd frontend && npx ng build`.
- [ ] CLAUDE.md describes the new startup flow.
