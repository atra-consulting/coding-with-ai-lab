# Implementation Plan: CRON-AGENT-TASKS

Vercel-cron-driven autonomous agent-task solver loop + admin view of cron jobs and their runs.

## Test Command
- Backend: `cd backend && npm test` (Playwright API tests)
- Frontend: `cd frontend && npm run test:ci` (Karma headless)

## Architecture (locked)
Vercel cron (`*/10`) → `GET /api/cron/agent-tasks` → single-flight check → create `cron_run` (RUNNING) → fire GitHub `repository_dispatch` (`solve-agent-tasks`, payload `{cronRunId}`) → runner drains all sources via Claude CLI → `POST /api/cron/runs/:id/complete` closes the run. Admin view reads `/api/cron/jobs` + `/api/cron/runs`. "Run now" button calls the same GET endpoint with an admin session.

## Final data model (reconciled to locked spec)
Table `cron_run` — **camelCase column identifiers** (matches existing `agent_task` convention), id strategy = `INTEGER PRIMARY KEY AUTOINCREMENT` (same as every other table). Single `result` JSON column + `error` (NOT separate count columns).

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK AUTOINCREMENT | |
| job | TEXT NOT NULL | e.g. `solve-tasks` |
| status | TEXT NOT NULL | RUNNING \| SUCCESS \| FAILED \| SKIPPED |
| trigger | TEXT NOT NULL | CRON \| MANUAL — quote as `"trigger"` in ALL raw SQL (defensive: libSQL's remote parser may treat the keyword differently than local SQLite, and unquoted keyword-named columns are harder to audit) |
| startedAt | TEXT NOT NULL | ISO-8601 (`new Date().toISOString()`), set explicitly by the service — **no `datetime('now')` DEFAULT** (see note) |
| finishedAt | TEXT | nullable; must be set atomically with `durationMs` in every UPDATE path |
| durationMs | INTEGER | nullable, computed finishedAt−startedAt (set together with finishedAt) |
| result | TEXT | nullable JSON summary, e.g. `{"openTasks":3,"dispatched":true}`, `{"tasksSolved":2,"tasksRejected":1}`, or `{"skipReason":"No OPEN agent tasks"}` |
| githubRunUrl | TEXT | nullable click-through to the Actions run |
| error | TEXT | nullable failure message |

**`startedAt` timestamp note (resolves be-reviewer vs db-reviewer conflict):** Unlike other tables, `startedAt` has **no** `DEFAULT (datetime('now'))`. Reason: the orphan/staleness guard compares `startedAt < <ISO threshold>` as a string. `datetime('now')` yields `2026-06-16 10:00:00` (space, no `Z`) which does **not** sort consistently against `new Date().toISOString()` → `2026-06-16T10:00:00.000Z` (`' ' < 'T'`). So the service ALWAYS inserts an explicit ISO-8601 string (per CLAUDE.md's ISO rule) and the guard threshold is computed in JS as `new Date(Date.now() - 30*60*1000).toISOString()` — both ISO, lexicographic comparison valid. Trade-off accepted: a raw insert omitting `startedAt` gets a loud `NOT NULL` error instead of a silent wrong-format default — which is preferable here since all inserts go through the service.

Indexes (2): `idx_cron_run_startedAt (startedAt DESC)` — global history feed; `idx_cron_run_job_startedAt (job, startedAt DESC)` — per-job newest-first. **No `status` index** — the single-flight `COUNT WHERE status='RUNNING'` over a small housekeeping table is fast without one, and an index there would be invalidated by the orphan-expiry UPDATE every tick (per db-review).

## Tasks

### 1. Database (db-coder domain)
- [ ] `backend/src/db/schema/schema.ts` — add Drizzle `cronRun = sqliteTable('cron_run', {...})` after `agentTask`, mirroring its style. Columns per the table above. `startedAt`: `text('startedAt').notNull()` with **no** `.default(...)`.
- [ ] `backend/src/config/migrate.ts` — add `CREATE TABLE IF NOT EXISTS cron_run (...)` to the DDL block with `"trigger"` quoted and `startedAt TEXT NOT NULL` (no default); add the **two** `CREATE INDEX IF NOT EXISTS` (startedAt, job+startedAt) to the index block. No status index.
- [ ] Verify with `cd backend && npx tsc --noEmit` (no Drizzle drift).

### 2. Backend config + service + util (be-coder / db-coder)
- [ ] `backend/src/config/cronJobs.ts` — `CronJob` interface + `CRON_JOBS` array. Initial: `{ name:'solve-tasks', schedule:'*/10 * * * *', description:'Drain all OPEN agent tasks via GitHub Actions', dispatchEventType:'solve-agent-tasks' }`. Single source of truth for the jobs list.
- [ ] `backend/src/utils/githubDispatch.ts` — `dispatchWorkflow(eventType, clientPayload)`: POST `https://api.github.com/repos/atra-consulting/coding-with-ai-lab/dispatches` with `Authorization: Bearer ${GH_DISPATCH_TOKEN}`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`, body `{event_type, client_payload}`. Uses global `fetch`. Throws on missing token or non-2xx (include status+body in the message). Repo slug overridable via `GH_DISPATCH_REPO` with the hardcoded fallback.
- [ ] `backend/src/utils/pagination.ts` — add `cronRun` to `ALLOWED_SORT_FIELDS` (startedAt, finishedAt, status, job, trigger).
- [ ] `backend/src/services/cronService.ts`:
  - `createRun(job, trigger)` → INSERT RUNNING, startedAt=now, return row.
  - `recordSkip(job, trigger, skipReason)` → INSERT SKIPPED with finishedAt=startedAt=now, result=`{"skipReason":...}`.
  - `markFailed(id, error)` → UPDATE FAILED, finishedAt=now, durationMs.
  - `completeRun(id, {status, tasksSolved, tasksRejected, githubRunUrl})` → UPDATE status, githubRunUrl, result=`{"tasksSolved","tasksRejected"}`, finishedAt=now, durationMs. `NotFoundError` if id missing.
  - `isRunInProgress(job)` → COUNT RUNNING. **Orphan/staleness guard**: before counting, expire RUNNING rows older than 30 min. Threshold computed in JS: `const cutoff = new Date(Date.now() - 30*60*1000).toISOString()` then `UPDATE cron_run SET status='FAILED', error='Orphaned: no callback within 30 min', finishedAt=<nowISO>, durationMs=<computed> WHERE status='RUNNING' AND startedAt < <cutoff>` (both sides ISO-8601 → safe string compare). Set finishedAt + durationMs atomically. Then COUNT remaining RUNNING; return >0.
  - `listRuns(job?, page, size, sort)` → paginated `buildPage` (Spring shape), optional `WHERE job=?`, ORDER BY whitelisted sort, default `startedAt DESC`.
  - `deriveJobsWithLastRun()` → for each `CRON_JOBS` entry attach newest `cron_run` as `lastRun`.
  - Export `CompleteRunBodySchema` (Zod): `status: enum(SUCCESS,FAILED)`, `tasksSolved/Rejected: int>=0`, `githubRunUrl: url`.
  - DTOs camelCase, no field mapping needed (column names == DTO names).

### 3. Backend routes + auth (be-coder)
**Import paths (verified by review):** `requireAgentToken` from `../middleware/agentAuth.js` (NOT `auth.js`); `requireAuth`, `requireRole`, `UnauthorizedError` from `../middleware/auth.js`; `findById` from `../config/users.js`; `validate` from `../utils/validation.js` (use it for `CompleteRunBodySchema` so Zod errors map to the standard `{fieldErrors}` shape); `asyncHandler` per existing routes.
- [ ] `backend/src/routes/cron.ts` with an inline `requireCronAuth` either/or guard (existing middleware is all-or-nothing):
  - **Path 1 (CRON):** `Authorization: Bearer <CRON_SECRET>` → trigger=CRON. Use `timingSafeEqual` for the compare (consistency with `requireAgentToken`). If `CRON_SECRET` unset, this path is disabled (local "Run now" still works via session).
  - **Path 2 (MANUAL):** valid admin session (`req.session.userId` → `findById` → `roles.includes('ADMIN')`) → trigger=MANUAL, set `req.currentUser`.
  - Neither → `next(new UnauthorizedError(...))`.
  - Endpoints:
    - `GET /agent-tasks` (`requireCronAuth`): single-flight (skip if RUNNING), skip if zero OPEN tasks — compute via `const summary = await agentTaskService.getSummary(); const hasOpen = summary.some(s => s.openCount > 0);` (no single-count helper exists; must aggregate per-source `openCount`). Else `createRun` + `dispatchWorkflow`; on dispatch error → `markFailed`. **Always respond 200** with the run object (4xx/5xx would make Vercel cron auto-retry and create duplicate RUNNING rows). Justified in code comment.
    - `POST /runs/:id/complete` (`requireAgentToken`): validate `CompleteRunBodySchema` → `completeRun`.
    - `GET /runs` (`requireAuth` + `requireRole('ADMIN')`): paginated, `?job=` filter, `?sort=`, newest first.
    - `GET /jobs` (`requireAuth` + `requireRole('ADMIN')`): `deriveJobsWithLastRun`.
  - All handlers use the existing `asyncHandler` wrapper; errors flow through the global `errorHandler`.
- [ ] `backend/src/app.ts` — import `cronRouter`, `app.use('/api/cron', cronRouter)` after the agent-tasks mount, before `errorHandler`.

### 4. Vercel config (be-coder)
- [ ] `vercel.json` — add `"crons": [{ "path": "/api/cron/agent-tasks", "schedule": "*/10 * * * *" }]`. (Fires only on the production deployment.)

### 5. CI workflow (be-coder)
- [ ] `.github/workflows/agent-task-runner.yml`:
  - Add trigger `on: repository_dispatch: types: [solve-agent-tasks]` (keep existing `workflow_dispatch` + `schedule`).
  - Add job-level `concurrency: { group: agent-task-runner, cancel-in-progress: false }` (queue overlapping ticks).
  - Replace single-source step with a **drain-all-sources** loop (EMAIL/GITHUB_ISSUE/APP_LOG/ERROR_REPORT, like `scripts/solve-all-agent-tasks.sh`), `MAX_PER_SOURCE` cap, watch the "No open <SOURCE> tasks" sentinel. Track best-effort solved/rejected counts (sentinel-string count from claude output; counts are informational). Emit `run_status`, `total_solved`, `total_rejected` to `$GITHUB_OUTPUT`.
  - Add a callback step `if: always() && env.CRON_RUN_ID != ''` reading `cronRunId` from `github.event.client_payload.cronRunId`; `curl POST ${APP_BASE_URL}/api/cron/runs/${CRON_RUN_ID}/complete` with `Authorization: Bearer ${AGENT_API_TOKEN}` and body `{status, tasksSolved, tasksRejected, githubRunUrl}` where `githubRunUrl=${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}`. Manual/scheduled paths (empty cronRunId) skip the callback.

### 6. Frontend admin view (fe-coder)
- [ ] `frontend/src/app/core/models/cron.model.ts` — `CronRunStatus`, `CronTrigger`, `CronRun`, `CronJobLastRun`, `CronJob`. Reuse existing `core/models/page.model.ts` `Page<T>`.
- [ ] `frontend/src/app/core/services/cron.service.ts` — `getJobs()`, `getRuns(page,size,job?)`, `triggerNow()` (GET `/api/cron/agent-tasks`; session cookie via existing interceptor). Base `/api/cron`.
- [ ] `frontend/src/app/features/admin/cron/cron-dashboard.component.{ts,html,scss}` — **one** standalone component (no child list; only one job type, table always visible):
  - Job cards (name, schedule, description, last-run time + status badge).
  - Runs table: Status badge, Job, Trigger badge, Gestartet, Beendet, Dauer, GH-Link (`<a target="_blank" rel="noopener">` when `githubRunUrl`), empty-state row. Optionally show parsed `result` counts.
  - "Jetzt ausführen" button → `runNow()` (spinner while `triggering`), then refresh jobs + runs; alert for result/error.
  - `statusBadgeClass`: RUNNING→bg-primary, SUCCESS→bg-success, FAILED→bg-danger, SKIPPED→bg-secondary (do NOT copy the agent-task OPEN/IN_PROGRESS/DONE/REJECTED map). `triggerBadgeClass`: CRON→light/border, MANUAL→bg-info. `formatDuration`.
  - NgbPagination: initialise `currentPage = 1` explicitly (1-indexed UI), pass `currentPage - 1` to the service; guard the `<ngb-pagination>` with `@if (runsPage && runsPage.totalPages > 1)`. `@if`/`@for` with `track`, `inject()` DI, `styleUrl` (singular).
  - Use `DestroyRef` + `takeUntilDestroyed()` on subscriptions (match the agent-tasks components' teardown pattern).
- [ ] `frontend/src/app/features/admin/admin.routes.ts` — add `{ path:'cron', canActivate:[roleGuard('ROLE_ADMIN')], loadComponent: () => import('./cron/cron-dashboard.component').then(m => m.CronDashboardComponent) }`.
- [ ] `frontend/src/app/layout/sidebar/sidebar.component.ts` — add `faClock` import + a `{ label:'Cron-Jobs', route:'/admin/cron', icon:faClock, requiredRole:'ROLE_ADMIN' }` item under Administration (same gating as the agent-tasks entry). No template change.

### 7. Docs + secrets (be-coder)
- [ ] `docs/API-TASKS.md` — add `## Cron Runner API` (the 4 endpoints, auth schemes, always-200 semantics, Spring-Page shape) + an `## Environment Variables` section listing `AGENT_API_TOKEN` (Vercel+GitHub, reused), `CRON_SECRET` (Vercel), `GH_DISPATCH_TOKEN` (Vercel; fine-grained PAT, Contents R/W + Actions R/W). All read from `process.env`, never committed.
- [ ] `docs/specs/SPECS-database.md` — add a `cron_run` entry (and fix the stale "6 tables" count / missing `agent_task`) so the DB spec stays authoritative.

### 8. Tests
- [ ] Backend Playwright (`backend/src/test/cron.spec.ts`): single-flight SKIPPED when a RUNNING row exists; SKIPPED when no OPEN tasks; dispatch path creates RUNNING (stub/skip the real GitHub call — e.g. unset `GH_DISPATCH_TOKEN` to force a deterministic FAILED, or assert the RUNNING row); callback `completeRun` sets SUCCESS + duration + result; auth — 401 without CRON_SECRET header AND without admin session; `GET /runs` & `/jobs` admin-only (403/401 otherwise); pagination shape.
- [ ] Frontend Karma: `cron.service.spec.ts` (HTTP calls + params), `cron-dashboard.component.spec.ts` (renders jobs/runs, Run now triggers + refresh, badge classes).

### 9. Verification
- [ ] `cd backend && npx tsc --noEmit` and `cd frontend && npx ng build` compile clean.
- [ ] Backend + frontend test suites green.
- [ ] Manual smoke: log in as admin, open `/admin/cron`, click "Jetzt ausführen" → a MANUAL run row appears (SKIPPED if no OPEN tasks / no GH token locally).

## Notes / risks
- `*/10` schedule requires the Vercel team on **Pro**; the "Run now" button works on any plan and is the local-dev test path (Vercel crons never fire locally).
- Best-effort solved/rejected counts depend on prompt output wording — informational only; the authoritative task outcomes live in the agent-tasks dashboard.
- Theoretical race between `isRunInProgress` and `createRun` on simultaneous ticks — negligible at 10-min spacing (Vercel serializes per-path); orphan guard prevents permanent deadlock.
