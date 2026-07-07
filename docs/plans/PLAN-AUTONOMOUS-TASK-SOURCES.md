# Implementation Plan: AUTONOMOUS-TASK-SOURCES

> **Nachtrag (2026-07-07):** `docs/WORKSHOP-AUTONOMOUS-TASKS.md` gibt es nicht (mehr). Die Agent-Doku steht in `docs/API-TASKS.md`.

Source PRD: `docs/prds/PRD-AUTONOMOUS-TASK-SOURCES.md`

## Test Command

- Backend (Playwright API): `cd backend && npm test`
- Frontend (Karma headless): `cd frontend && npm run test:ci`
- Type/build gates: `cd backend && npx tsc --noEmit` ; `cd frontend && npx ng build`

## Verified Codebase Patterns (basis for every task)

- **enums.ts**: `as const` SCREAMING_SNAKE array + derived `(typeof ARR)[number]` type.
- **schema.ts**: imports `{ sqliteTable, integer, text, real }` + `{ sql }`. Date defaults `default(sql\`(datetime('now'))\`)`. Banner comments per table.
- **migrate.ts**: tables in one `client.executeMultiple(...)`, indexes in a second. Raw DDL `DEFAULT (datetime('now'))`.
- **DB client**: libsql `client.execute({ sql, args })` — **async**, rows via `result.rows[0] as unknown as Row`. NOT better-sqlite3, NOT Drizzle query builder. Matches `chanceService.ts`.
- **Routes**: `asyncHandler` wraps handlers; `validate(schema, req.body)` throws `ValidationError` with `fieldErrors`; `requireAuth` then `requireRole('ADMIN')`; errors from `utils/errors.ts`.
- **Frontend**: standalone components, `inject()` DI, `@if`/`@for` with `track`, `Page<T>` model, NgbPagination 1-indexed → backend 0-indexed (`currentPage - 1`). Admin routes use `roleGuard('ROLE_ADMIN')` from `core/guards/role.guard`. Sidebar `NavItem` with `requiredRole: 'ROLE_ADMIN'`.

---

## Phase 1 — Database & Seed (db-coder)

### 1.1 Enums — `backend/src/db/schema/enums.ts`
- [ ] Add `AGENT_TASK_SOURCE = ['EMAIL','GITHUB_ISSUE','APP_LOG','ERROR_REPORT'] as const` + `export type AgentTaskSource = (typeof AGENT_TASK_SOURCE)[number]`.
- [ ] Add `AGENT_TASK_STATUS = ['OPEN','IN_PROGRESS','DONE','REJECTED'] as const` + `export type AgentTaskStatus`. Lifecycle: OPEN →(claim via /next)→ IN_PROGRESS →(/done|/reject)→ DONE|REJECTED.

### 1.2 Schema — `backend/src/db/schema/schema.ts`
- [ ] Add `// ─── agentTask ───` banner + `export const agentTask = sqliteTable('agent_task', {...})` with 11 columns. `status` `.default('OPEN')`. `createdAt`/`updatedAt` use `sql\`(datetime('now'))\``. `comment`, `metadata`, `pickedUpAt`, `resolvedAt` nullable. No new imports needed.

### 1.3 Migration — `backend/src/config/migrate.ts`
- [ ] Append `CREATE TABLE IF NOT EXISTS agent_task (...)` to the first `executeMultiple` block (raw DDL, `DEFAULT (datetime('now'))`, `status ... DEFAULT 'OPEN'`).
- [ ] Append to the index block: `idx_agent_task_status_createdAt ON agent_task(status, createdAt)` and `idx_agent_task_source_status ON agent_task(source, status)`.
- [ ] Update the FK-order comment to mention `agent_task`.

### 1.4 Seed wiring — `backend/src/seed/dataMigration.ts`
- [ ] Add `agentTask: Record<string, unknown>[]` to the `Fixture` interface.
- [ ] Add `agentTask` entry to `INSERT_SQL` naming all 11 columns with `@column` placeholders.
- [ ] Append `'agentTask'` to `INSERT_ORDER` (last — no FK deps).
- [ ] Extend the final console log to include `fixture.agentTask.length`.
- [ ] Do NOT touch the `SELECT COUNT(*) FROM firma` guard (all-or-nothing seeding; test plan uses `--reset-db`).

### 1.5 Seed data — `backend/src/seed/fixture.json`
- [ ] Add top-level `"agentTask"` array with 16 rows (ids 1–16, independent table). Every row: `status:"OPEN"`, `comment:null`, `pickedUpAt:null`, `resolvedAt:null`, ISO `createdAt`/`updatedAt`, non-empty `body`, source-specific `metadata` JSON string.
- [ ] **EMAIL (4):** (1 Accept) "Show company phone in list view" — body verbatim: *"The phone number is stored but not shown in the company list table. Please add the `phone` column to the company list."*; (2 Accept) "Sort activity list by date descending by default"; (3 Reject) "Make the app look nicer" (vague); (4 Reject) "Fix the broken feature" (no feature/repro).
- [ ] **GITHUB_ISSUE (4):** (5 Accept) "Show total pipeline value on Chancen board"; (6 Accept) "Filter persons list by department"; (7 Reject) "Improve performance"; (8 Reject) "The dashboard is wrong".
- [ ] **APP_LOG (4):** (9 Accept) "Unhandled error body on GET /api/firmen/999 after delete"; (10 Accept) "Missing updatedAt in Abteilung create response"; (11 Reject) "Intermittent 500 on startup"; (12 Reject) "Occasional slow query".
- [ ] **ERROR_REPORT (4):** (13 Accept) "TypeError: Cannot read properties of null (reading 'id') in firmaService.findById"; (14 Accept) "ReferenceError: stadtField is not defined in adresse form"; (15 Reject) "App crashes intermittently on Linux"; (16 Reject) "Something fails sometimes on save".
- [ ] Verify each Accept task maps to genuinely-missing functionality before finalizing.

---

## Phase 2 — Backend API (be-coder)

### 2.1 Sort whitelist — `backend/src/utils/pagination.ts`
- [ ] Add `agentTask` to `ALLOWED_SORT_FIELDS`: `createdAt, updatedAt, status, source, title`.

### 2.2 Service — `backend/src/services/agentTaskService.ts` (new)
- [ ] `AgentTaskDTO`, `AgentTaskRow`, `toDTO()`, `AgentTaskSummaryDTO`. Export `agentTaskService` object (matches `chanceService` style).
- [ ] `findNext(source)`: single atomic `UPDATE agent_task SET status='IN_PROGRESS', pickedUpAt=datetime('now') WHERE id=(SELECT id ... WHERE status='OPEN' AND source=? ORDER BY createdAt ASC LIMIT 1) RETURNING *`. The `OPEN→IN_PROGRESS` flip is the compare-and-swap claim guard (no separate `pickedUpAt IS NULL` needed). Return DTO or `null`.
- [ ] `findById(id)`: SELECT; throw `NotFoundError` if absent.
- [ ] `reject(id, comment)`: load via findById; if `status === 'DONE' || status === 'REJECTED'` → `ConflictError` (OPEN and IN_PROGRESS both allowed); UPDATE status=REJECTED, comment, resolvedAt=datetime('now'), updatedAt=ISO.
- [ ] `done(id, comment?)`: same terminal-state guard; UPDATE status=DONE, comment ?? null, resolvedAt, updatedAt.
- [ ] `findAll(filters, page, size, sort)`: dynamic parameterized WHERE (source/status), COUNT + paged SELECT, return `buildPage(...)`.
- [ ] `getSummary()`: `GROUP BY source` with `SUM(CASE WHEN status=...)` for OPEN, IN_PROGRESS, DONE, REJECTED → `{source, openCount, inProgressCount, doneCount, rejectedCount}`. Backfill all four sources with zero counts if absent.

### 2.3 Middleware — `backend/src/middleware/agentAuth.ts` (new)
- [ ] `requireAgentToken`: read `process.env['AGENT_API_TOKEN']`; if unset/empty → `next(new UnauthorizedError(...))` immediately (no compare). Extract token from `Authorization: Bearer` or `X-Agent-Token`; missing → 401. SHA-256 hash both (`createHash('sha256').update(s).digest()` → 32-byte Buffers), `timingSafeEqual`; mismatch → 401. Never touches session.

### 2.4 Routes — `backend/src/routes/agentTasks.ts` (new)
- [ ] Inline Zod: `RejectBodySchema = z.object({ comment: z.string().min(1) })`, `DoneBodySchema = z.object({ comment: z.string().optional() })`.
- [ ] Register in EXACT order (REQ-012b):
  1. `GET /next` (`requireAgentToken`) — validate `source` present (missing → 400 ValidationError) and in `AGENT_TASK_SOURCE` whitelist (invalid → 400); `findNext`; 204 if null else json.
  2. `GET /summary` (`requireAuth`+`requireRole('ADMIN')`) — `getSummary`.
  3. `POST /:id/reject` (`requireAgentToken`) — validate body, `reject`.
  4. `POST /:id/done` (`requireAgentToken`) — validate body, `done`.
  5. `GET /:id` (`requireAuth`+`requireRole('ADMIN')`) — `findById`.
  6. `GET /` (`requireAuth`+`requireRole('ADMIN')`) — `parsePaginationParams` + `parseSort(..., 'agentTask')` + source/status filters → `findAll`.

### 2.5 Mount — `backend/src/app.ts`
- [ ] Import + `app.use('/api/agent-tasks', agentTasksRouter)` before `errorHandler`.

### 2.6 Review fixes (be-reviewer)
- [ ] `findNext`: also set `updatedAt=datetime('now')` on the OPEN→IN_PROGRESS claim.
- [ ] `reject`/`done`: make the terminal-state guard atomic — conditional `UPDATE ... WHERE id=? AND status NOT IN ('DONE','REJECTED')`; if `rowsAffected===0`, `findById` to return 404 (missing) vs 409 (terminal). Preserves the 409 under concurrency.

### 2.7 Admin reset endpoint (repeated workshop runs)
- [ ] Service `resetAll()`: `UPDATE agent_task SET status='OPEN', comment=NULL, pickedUpAt=NULL, resolvedAt=NULL, updatedAt=datetime('now')`. Returns count reset.
- [ ] Route `POST /reset` (`requireAuth`+`requireRole('ADMIN')`) — register BEFORE `/:id` routes. Returns `{ reset: <count> }`. Re-arms all tasks to OPEN without `--reset-db`.

---

## Phase 3 — Frontend Dashboard (fe-coder + ui-designer)

### 3.1 Model — `frontend/src/app/core/models/agent-task.model.ts` (new)
- [ ] `type AgentTaskSource`, `type AgentTaskStatus = 'OPEN'|'IN_PROGRESS'|'DONE'|'REJECTED'` unions; `interface AgentTask` (11 fields, nullable as `| null`); `interface AgentTaskSummary { source, openCount, inProgressCount, doneCount, rejectedCount }`.

### 3.2 Service — `frontend/src/app/core/services/agent-task.service.ts` (new)
- [ ] `@Injectable({providedIn:'root'})`, `inject(HttpClient)`, `baseUrl='/api/agent-tasks'`.
- [ ] `getAll(page=0,size=10,sort='createdAt,desc',source?,status?): Observable<Page<AgentTask>>` (caller passes 0-indexed page).
- [ ] `getById(id): Observable<AgentTask>`; `getSummary(): Observable<AgentTaskSummary[]>`.

### 3.3 Components — `frontend/src/app/features/admin/agent-tasks/` (new)
- [ ] **`agent-tasks-dashboard.component.ts`** (selector `app-agent-tasks-dashboard`): subscribes to `route.queryParams`. **No `source` → show four Bootstrap summary cards** (from `getSummary()`); **`source` present → render `<app-agent-task-list>`** (imports `AgentTaskListComponent`). Resolves the shared-path ambiguity. Source labels: EMAIL→"Customer Emails", GITHUB_ISSUE→"GitHub Issues", APP_LOG→"Application Logs", ERROR_REPORT→"Error Reports". Cards show OPEN / IN_PROGRESS / DONE / REJECTED counts in `row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3`, `.card h-100`, counts as `<dl class="row">`, drill-in `btn btn-sm btn-outline-primary w-100` with `[queryParams]="{source}"`. Loading + error states.
- [ ] **`agent-task-list.component.ts`** (selector `app-agent-task-list`): `inject(AgentTaskService, ActivatedRoute)`. Reads `source` from queryParams, `loadTasks()` calls `getAll(currentPage-1, 20, 'createdAt,desc', source)`. Bootstrap `table table-hover table-sm align-middle` in `.table-container`. Columns: ID, Title, Status badge, pickedUpAt, resolvedAt, body preview (≤80 chars). Rows `routerLink` to `/admin/agent-tasks/:id`, `cursor-pointer`. NgbPagination bound to `totalElements`. Null timestamps render `—`.
- [ ] **`agent-task-detail.component.ts`** (selector `app-agent-task-detail`): reads `:id` from snapshot, `getById`. `.table-container` + `<dl class="row">` fields; body in `<pre class="bg-light border rounded p-3 small">`; metadata `JSON.stringify(JSON.parse(metadata),null,2)` in `<pre ... font-monospace>` guarded by `@if`. Shared `statusBadgeClass()`: OPEN→`bg-info`, IN_PROGRESS→`bg-warning text-dark`, DONE→`bg-success`, REJECTED→`bg-danger`.
- [ ] Page headers use `.page-header` with `<h2>`; list view adds a "Zurück" `btn btn-sm btn-outline-secondary` to `/admin/agent-tasks`.

### 3.4 Routes — `frontend/src/app/features/admin/admin.routes.ts`
- [ ] Add (after geocoding), both `canActivate: [roleGuard('ROLE_ADMIN')]`, in this order: `agent-tasks` → `AgentTasksDashboardComponent`; `agent-tasks/:id` → `AgentTaskDetailComponent`. No new permission string; no `app.routes.ts` change.

### 3.5 Sidebar — `frontend/src/app/layout/sidebar/sidebar.component.ts`
- [ ] Add icon (e.g. `faTasks`) import + field. Append to Administration `items`: `{ label:'Agent-Aufgaben', route:'/admin/agent-tasks', icon: faTasks, requiredRole:'ROLE_ADMIN' }`. `visibleItems()` already hides for non-admins.

### 3.6 Reset button (dashboard)
- [ ] Add a "Alle Aufgaben zurücksetzen" (Reset all tasks) button to the dashboard summary view (no `source`). On click: confirm, call `AgentTaskService.resetAll()` → `POST /api/agent-tasks/reset`, then reload `getSummary()`. Service method `resetAll(): Observable<{reset:number}>`. Lets a presenter re-arm tasks between workshop runs in one click.

---

## Phase 4 — Per-Source Prompts (direct)

### 4.1 Prompt files — `.claude/prompts/` (new)
- [ ] `agent-email.md`, `agent-github-issue.md`, `agent-app-log.md`, `agent-error-report.md`. Each (per REQ-013, autonomous mode):
  1. `curl GET /api/agent-tasks/next?source=<SOURCE>` with bearer `AGENT_API_TOKEN` (read base URL from `APP_BASE_URL` env, default `http://localhost:7070`). 204 → exit "no open tasks".
  2. Read `title`/`body`/`metadata`. **Decide accept vs reject FIRST** with explicit criteria (accept = one clear solution, complete context, in-scope; reject = vague/underspecified/multiple solutions/missing info).
  3. **Reject** → `POST /:id/reject` with mandatory `comment` explaining why. Stop. Do NOT call plan-and-do.
  4. **Accept** → invoke `.claude/skills/plan-and-do/SKILL.md` with the task body as description. Pre-authorize ALL checkpoints in the prompt text: scope = full (implement, review, PR, merge); keep planning files; every `AskUserQuestion` → recommended/Continue without waiting. State explicitly that headless `claude -p` cannot surface prompts.
  5. After merge → `POST /:id/done` with short resolution comment. Exit.
- [ ] A shared snippet/section documenting the curl auth header + base URL so all four prompts stay consistent.

---

## Phase 5 — Sample GitHub Actions Workflow (direct)

### 5.1 `.github/workflows/agent-task-runner.yml` (new)
- [ ] `workflow_dispatch` + `schedule` (daily 02:00 UTC). Steps: checkout, setup-node (match `deploy.yml` version/`.nvmrc`), install backend deps, set env `AGENT_API_TOKEN`, `APP_BASE_URL`, `ANTHROPIC_API_KEY` from secrets, run `claude -p .claude/prompts/agent-email.md`.
- [ ] Header comments: does NOT run without secrets; lists all three required secrets; reference implementation only. Match `deploy.yml` style (`actions/checkout@v4`, `actions/setup-node@v4`).

## Phase 5b — Workshop Operations Guide (direct) — NEW per user request

### 5b.1 `docs/WORKSHOP-AUTONOMOUS-TASKS.md` (new)
- [ ] **Reset between runs:** document the admin reset button + the `POST /api/agent-tasks/reset` curl equivalent, and `./start.sh --reset-db` as the full reset.
- [ ] **Solve ALL tasks locally:** document `scripts/solve-all-agent-tasks.sh` (below) — loops every source, repeatedly runs the matching prompt until `/next` returns 204. Explain expected outcome (2 solved + 2 rejected per source).
- [ ] **Remove the task-solution Git commits after a run:** document how to undo the branches/PRs/commits Claude created. Approach: tag a baseline before the workshop (`git tag workshop-baseline`), list agent branches (`git branch --list 'agent-*' 'autonomous-*'` etc.), delete them, and reset `main` back to the tag (`git reset --hard workshop-baseline` + force-push to a demo remote ONLY). Include the safe per-PR `git revert` alternative. Clearly warn this rewrites history — demo repos only.

### 5b.2 `scripts/solve-all-agent-tasks.sh` (new)
- [ ] Bash helper: for each source in EMAIL/GITHUB_ISSUE/APP_LOG/ERROR_REPORT, loop: `curl /next?source=X` (auth header); if 204 → next source; else run `claude -p .claude/prompts/agent-<source>.md`. Reads `AGENT_API_TOKEN` + `APP_BASE_URL` (default localhost:7070) from env. Echo progress. Make it the one-command "solve everything" entry point for local testing.

---

## Phase 6 — Backend Tests (be-test-coder)

### 6.1 `backend/src/test/agentTasks.spec.ts` (new) — Playwright API
- [ ] `/next?source=EMAIL` valid token → 200, sets `status=IN_PROGRESS` + `pickedUpAt`; returns only EMAIL.
- [ ] `/next` no `source` → 400; `/next?source=INVALID` → 400.
- [ ] `/next?source=EMAIL` repeated → claimed task never returned again; 204 once all EMAIL OPEN tasks claimed.
- [ ] `/:id/reject` with comment on IN_PROGRESS → 200 REJECTED + comment + resolvedAt; on OPEN → 200; without comment → 400 fieldErrors; on DONE/REJECTED → 409.
- [ ] `/:id/done` on IN_PROGRESS (optional comment) → 200 DONE; on OPEN → 200; on DONE/REJECTED → 409.
- [ ] Agent endpoints: wrong token → 401; no token → 401.
- [ ] `GET /` admin → 200; user → 403; unauth → 401; agent-token → 401.
- [ ] `GET /summary` admin → 200 (4 sources); user → 403; unauth → 401.
- [ ] Use existing test login/session helpers; isolate by reading seed ids or creating known state.

---

## Phase 7 — Frontend Tests (fe-test-coder)

### 7.1 Specs colocated under `features/admin/agent-tasks/`
- [ ] Dashboard renders 4 cards with summary counts (mock service).
- [ ] Dashboard with `?source=EMAIL` queryParam renders the list child.
- [ ] List renders rows filtered by source; pagination conversion correct.
- [ ] Detail renders all fields; `statusBadgeClass` mapping correct.
- [ ] Sidebar hides "Agent-Aufgaben" for non-admin; `roleGuard` blocks USER, permits ADMIN.

---

## Phase 8 — Verification
- [ ] `cd backend && npx tsc --noEmit` clean.
- [ ] `cd frontend && npx ng build` clean.
- [ ] `cd backend && npm test` green.
- [ ] `cd frontend && npm run test:ci` green.
- [ ] `yamllint .github/workflows/agent-task-runner.yml` valid.
- [ ] Manual smoke: `./start.sh --reset-db` → 16 tasks; admin sees dashboard + drill-in; `user` blocked; curl fetch/reject round-trip updates dashboard.

---

## Tests Summary
- **Backend (Playwright):** auth (token + session), status transitions/409s, mandatory comment 400, mandatory source 400, claim/204, summary counts. See Phase 6.
- **Frontend (Karma):** components render, queryParam switching, badge mapping, guard + sidebar gating. See Phase 7.
- **Edge cases:** unset `AGENT_API_TOKEN` → 401; concurrent `/next` (atomic claim) → no double-pick; invalid source → 400.
