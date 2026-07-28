# Implementation Plan: SEED-AGENT-TASKS-MIGRATION

This branch covers **two** independent changes:
- **Part A** — seed agent tasks via an idempotent migration (fixes empty tasks on Vercel).
- **Part B** — remove the now-dead admin geocoding feature (coordinates are baked into the seed).

## Test Command
- Part A: `cd backend && npm test`
- Part B: `cd backend && npm test` **and** `cd frontend && npm run test:ci` (touches both)

---

# PART A — Seed agent tasks via migration

## Test Command
`cd backend && npm test`  (backend-only change; frontend untouched)

## Problem

On Vercel (and any deployment whose DB already has CRM data), the agent-tasks dashboard shows 0 tasks. Root cause: `runDataMigration()` returns early when `firma` already has rows (`SELECT COUNT(*) FROM firma`), so the 16 `agent_task` rows in `fixture.json` are never inserted. The `agent_task` **table** is created fine (via `runMigrations()`, which runs unconditionally on every startup and Vercel cold-start in both `backend/src/index.ts` and `api/index.ts`) — only the **data** is missing.

## Approach

Add an **idempotent** agent-task seed (`INSERT OR IGNORE`, fixed ids 1–16) and fold it into `runMigrations()` — the single function both entry points call unconditionally. So the tasks are inserted on every deployment, independent of the firma-empty guard. `INSERT OR IGNORE` means: insert missing rows, never touch existing ones (an admin's DONE/REJECTED/IN_PROGRESS state survives restarts and redeploys; the dashboard "Reset" button is the way to re-arm).

`agent_task` becomes owned by ONE source (the new seed module), removed from the conditional `fixture.json` path to avoid duplication.

## Tasks

### 1. New seed module — `backend/src/seed/agentTaskSeed.ts` (new)
- [ ] Define a typed `AGENT_TASK_SEED` array holding the 16 rows currently in `fixture.json` `agentTask` (id 1–16; fields: source, title, body, status `OPEN`, comment `null`, metadata JSON string, pickedUpAt `null`, resolvedAt `null`, createdAt, updatedAt). Copy the exact values from `fixture.json`.
- [ ] Export `seedAgentTasks(): Promise<void>`: builds one `client.batch(stmts, 'write')` of `INSERT OR IGNORE INTO agent_task (id, source, title, body, status, comment, metadata, pickedUpAt, resolvedAt, createdAt, updatedAt) VALUES (...)` — one statement per row, named/positional args consistent with `dataMigration.ts`. Import `client` from `../config/db.js`, `InArgs` type as needed.
- [ ] Log one concise line (e.g. `=== Seeder: agent_task ensured (16 rows, INSERT OR IGNORE) ===`).

### 2. Hook into migrations — `backend/src/config/migrate.ts`
- [ ] Import `seedAgentTasks`. At the END of `runMigrations()` (after the DDL `executeMultiple` and the index `executeMultiple`), `await seedAgentTasks();`.
- [ ] Add a comment: idempotent data seed so agent tasks appear in every deployment (Vercel/Turso included), independent of the `firma`-empty guard in `runDataMigration`.

### 3. Remove agent_task from the conditional seed — `backend/src/seed/dataMigration.ts`
- [ ] Remove `agentTask` from the `Fixture` interface, `INSERT_SQL`, `INSERT_ORDER`, and the trailing `console.log` (drop the `${fixture.agentTask.length} AgentTasks` fragment).

### 4. Remove agent_task data — `backend/src/seed/fixture.json`
- [ ] Delete the top-level `agentTask` array (now lives in `agentTaskSeed.ts`).

### 5. Fix the test reset helper — `backend/src/test/helpers.ts`
- [ ] `resetDatabase()` deletes `agent_task` then re-runs `runDataMigration()` (which no longer seeds it). After that, `await seedAgentTasks();` to restore the 16 OPEN tasks. Import `seedAgentTasks` from `../seed/agentTaskSeed.js`.

### 6. Test Implementation — `backend/src/test/agentTaskSeed.spec.ts` (new, Playwright + db client)
- [ ] **Idempotent re-run:** delete all `agent_task`; `seedAgentTasks()` → 16 rows; `seedAgentTasks()` again → still 16, no error.
- [ ] **Seeds with non-empty firma (the bug):** confirm `firma` has rows; delete `agent_task`; `seedAgentTasks()` → 16 rows present. Proves seeding no longer depends on the firma guard.
- [ ] **Preserves modified rows:** set task id 1 → `DONE`; `seedAgentTasks()`; assert id 1 still `DONE` (INSERT OR IGNORE didn't reset it).

### 7. Verification
- [ ] `cd backend && npx tsc --noEmit` → zero errors.
- [ ] `cd backend && npm test` → full suite green (existing `agentTasks.spec.ts`, cron specs, etc. still pass — `resetDatabase()` still yields 16 OPEN).
- [ ] Local smoke against a NON-EMPTY db (do NOT `--reset-db`): start backend, `GET /api/agent-tasks/summary` (admin) shows 16 tasks across 4 sources — reproducing and fixing the Vercel scenario locally.

## Tests
### Integration (Playwright, `backend/src/test/`)
- [ ] `agentTaskSeed.spec.ts`: idempotent re-run; seeds when firma non-empty; preserves a modified row.
- [ ] Regression: `agentTasks.spec.ts` + cron specs pass unchanged.

---

# PART B — Remove the admin geocoding feature

**Why safe (verified):** all 100 seed addresses already carry `latitude`/`longitude`; geocoding is never auto-triggered on address create/update (no call in `adresseService`/`adressen` route); it was only a manual admin batch to populate coords. The Firmenkarte map reads the baked-in coords, so it keeps working.

## Backend

### B1. Remove the admin geocode route — `backend/src/routes/admin.ts` + `backend/src/app.ts`
- [ ] `admin.ts` holds ONLY `POST /geocode-addresses` → delete the file.
- [ ] In `app.ts` remove `import adminRouter` (line ~13) and `app.use('/api/admin', adminRouter)` (line ~44).

### B2. Delete the service — `backend/src/services/geocodingService.ts`
- [ ] Delete the file.

### B3. Dev fixture builder — `backend/src/seed/build-fixture.ts`
- [ ] Verify it does NOT `import` `geocodingService` (it hardcodes coords offline). If clean, leave the file but tidy any stale geocoding comments. If it imports the service, neutralize that import so the build script still type-checks.

### B4. Test cleanup — `backend/src/test/`
- [ ] Delete `admin-geocoding.spec.ts` and `geocoding-rate-limit.spec.ts`.
- [ ] `globalSetup.ts`: remove the Nominatim stub HTTP server + the `NOMINATIM_BASE_URL`/`STUB_CONTROL_URL` env wiring it injects into the spawned backend. Keep the backend-spawn + health-poll logic intact. **Highest-risk edit — the suite must still boot the backend.**
- [ ] `helpers.ts`: remove the stub-control helpers (`setStubResponse`, `clearStubOverrides`, `getStubCallCount`, `resetStubCallCount`, `getControlUrl`) and the `StubBehavior` import. Keep `login`/`loginCtx`/`resetDatabase`/db helpers.

## Frontend

### B5. Delete the geocoding feature files
- [ ] `frontend/src/app/features/admin/admin-geocoding.component.ts` / `.html` / `.scss` / `.spec.ts`.
- [ ] `frontend/src/app/features/admin/admin.service.ts` + `admin.service.spec.ts` (only method is `geocodeAddresses`).
- [ ] `frontend/src/app/core/models/geocode-result.model.ts`.

### B6. Routes — `frontend/src/app/features/admin/admin.routes.ts`
- [ ] Remove the `geocoding` route entry. Keep agent-tasks and cron routes.

### B7. Sidebar — `frontend/src/app/layout/sidebar/sidebar.component.ts` (+ `.spec.ts`)
- [ ] Remove the "Adressen geokodieren" nav item (`route: '/admin/geocoding'`). Remove its FontAwesome icon import if now unused. Update the spec if it asserts that item.

## Verification (Part B)
- [ ] `cd backend && npx tsc --noEmit` and `cd frontend && npx ng build` → zero errors.
- [ ] `cd backend && npm test` and `cd frontend && npm run test:ci` → green (geocoding specs gone; nothing else references the stub).
- [ ] Grep `geocod|Geocod|geokod|Nominatim` across `backend/src` + `frontend/src` → only unrelated/comment hits remain (no live route, service, component, or import).
- [ ] Smoke: log in as admin → sidebar has no "Adressen geokodieren"; `/admin/geocoding` no longer resolves; the Firmenkarte map still shows pins (baked-in coords).

## Tests (Part B)
- [ ] Removed: `admin-geocoding.spec.ts`, `geocoding-rate-limit.spec.ts`, `admin.service.spec.ts`, `admin-geocoding.component.spec.ts`.
- [ ] Regression: full backend + frontend suites pass after stub removal.
