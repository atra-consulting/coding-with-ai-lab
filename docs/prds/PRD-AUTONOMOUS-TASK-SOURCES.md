# PRD: Autonomous Task Sources

## Source

Requested on 2026-06-13 for the "Claude Code for Advanced Users" workshop.
Workshop goal: show Claude Code, driven by GitHub Actions, pulling a task, deciding to solve or reject it, implementing it, and merging to `main` — fully autonomously.

## Problem Statement

The existing CRM app is used in a beginner workshop. Advanced users need a second feature that demonstrates autonomous AI-driven development. No such feature exists today.

Specifically:
- No table stores tasks that Claude can act on.
- No API serves tasks to a machine caller.
- No GitHub Actions workflow shows Claude picking up and completing work autonomously.
- No admin view lets humans monitor what Claude did.

## Requirements

### 1. Data Model and Seed

#### REQ-001: New `agent_task` table

Create one new table named `agent_task`. Do NOT create separate tables per source.

Column spec:

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| source | text | NOT NULL — enum: `EMAIL`, `GITHUB_ISSUE`, `APP_LOG`, `ERROR_REPORT` |
| title | text | NOT NULL |
| body | text | NOT NULL — raw content Claude reads |
| status | text | NOT NULL, default `OPEN` — enum: `OPEN`, `IN_PROGRESS`, `DONE`, `REJECTED` |
| comment | text | nullable — rejection or resolution comment |
| metadata | text | nullable — JSON string, source-specific fields (e.g. email sender, issue number, log level, stack trace) |
| pickedUpAt | text | nullable — ISO-8601 timestamp, set when a caller fetches the task |
| resolvedAt | text | nullable — ISO-8601 timestamp, set when status moves to DONE or REJECTED |
| createdAt | text | NOT NULL, default `datetime('now')` |
| updatedAt | text | NOT NULL, default `datetime('now')` |

New enums: `AgentTaskSource` (`EMAIL`, `GITHUB_ISSUE`, `APP_LOG`, `ERROR_REPORT`) and `AgentTaskStatus` (`OPEN`, `IN_PROGRESS`, `DONE`, `REJECTED`).

Status lifecycle: `OPEN` → (claimed via `/next`) → `IN_PROGRESS` → (`/done` or `/reject`) → `DONE` / `REJECTED`. Seed rows all start `OPEN`.

Schema files:
- `backend/src/db/schema/schema.ts` — Drizzle table definition. Date defaults MUST use the Drizzle `sql` tag: `default(sql\`(datetime('now'))\`)`. A bare string is not valid.
- `backend/src/config/migrate.ts` — `CREATE TABLE IF NOT EXISTS` DDL. Use `DEFAULT (datetime('now'))` in the SQL string.
- `backend/src/db/schema/enums.ts` — new enum arrays.

Add two indexes in `migrate.ts`:
- `CREATE INDEX IF NOT EXISTS idx_agent_task_status_createdAt ON agent_task(status, createdAt)`
- `CREATE INDEX IF NOT EXISTS idx_agent_task_source_status ON agent_task(source, status)`

Priority: High.
Acceptance: App starts without errors. Table exists in the SQLite file. All 11 columns present with correct types and defaults. Both indexes exist.

#### REQ-002: Seed data (16+ tasks total)

Load via the existing seed flow (`backend/src/seed/fixture.json` + `dataMigration.ts`). Loaded only when the DB is empty.

Adding `agent_task` entries to `fixture.json` requires:
1. Updating the `Fixture` TypeScript interface in `dataMigration.ts` to include `agentTask: AgentTaskSeed[]` (or equivalent).
2. Adding `agent_task` to the INSERT order and SQL map in `dataMigration.ts`.

The existing seed guard checks `SELECT COUNT(*) FROM firma`. `agent_task` seeds all-or-nothing with the rest of the fixture — either everything loads or nothing does. This is acceptable because the local test plan uses `--reset-db`. Do not change the seed guard logic.

Seed tasks must be fake but plausible. Each task body must give Claude enough — or deliberately not enough — context to make an accept/reject decision. This contrast is the pedagogical core.

**Customer emails — exactly 4 tasks (source: `EMAIL`)**

| # | Title (example) | Accept/Reject | Reason |
|---|-----------------|---------------|--------|
| 1 | Show company phone number in the company list view | Accept | The `firma` table already has a `phone` column. It appears on the detail page only. Show it in the list view — that change is missing. |
| 2 | Sort activity list by date descending by default | Accept | One sort change, clear target entity, no edge cases |
| 3 | Make the app look nicer | Reject | Vague, no spec, multiple valid interpretations |
| 4 | Fix the broken feature | Reject | No feature named, no repro steps, missing all context |

Note on seed #1: the `firma` table already has a `phone` column. "Add a phone column" is not a valid doable task. The body must explicitly state: "The phone number is stored but not shown in the company list table. Please add the `phone` column to the company list." This scopes the task to a genuinely missing UI change and prevents an agent from correctly rejecting it as already-done.

Before finalising the other "Accept" seed tasks, verify each maps to functionality that genuinely does not exist yet in this CRM. Do not seed a task whose change is already implemented.

**GitHub issues — exactly 4 tasks (source: `GITHUB_ISSUE`)**

| # | Title (example) | Accept/Reject | Reason |
|---|-----------------|---------------|--------|
| 1 | Show total pipeline value on Chancen board | Accept | Clear: sum `wert` across all Chancen, render on board header |
| 2 | Filter persons list by department | Accept | Clear: add `abteilungId` filter param to `/api/personen`, wire to frontend |
| 3 | Improve performance | Reject | No measured baseline, no slow query identified, not actionable |
| 4 | The dashboard is wrong | Reject | No description of what is wrong, no expected vs actual |

**Application logs — at least 4 tasks (source: `APP_LOG`)**

| # | Title (example) | Accept/Reject | Reason |
|---|-----------------|---------------|--------|
| 1 | 404 on GET /api/firmen/999 after delete | Accept | Expected 404, but log shows unhandled error body — fix error handler |
| 2 | Missing `updatedAt` in Abteilung create response | Accept | Clear: service omits field, easy to add |
| 3 | Intermittent 500 on startup | Reject | No stack trace, no repro frequency, no consistent trigger |
| 4 | Occasional slow query | Reject | No query text, no timing data, no table involved |

**Error reports — at least 4 tasks (source: `ERROR_REPORT`)**

| # | Title (example) | Accept/Reject | Reason |
|---|-----------------|---------------|--------|
| 1 | TypeError: Cannot read properties of null (reading 'id') in firmaService.findById | Accept | Clear stack trace, fix is a null check before access |
| 2 | ReferenceError: stadtField is not defined in adresse form | Accept | Clear: variable name typo in frontend form component |
| 3 | App crashes intermittently on Linux | Reject | No stack trace, not reproducible, OS-level hearsay |
| 4 | Something fails sometimes on save | Reject | No entity, no field, no error message, useless |

Metadata column content per source:
- `EMAIL`: `{ "sender": "...", "subject": "..." }`
- `GITHUB_ISSUE`: `{ "issueNumber": 42, "labels": ["enhancement"] }`
- `APP_LOG`: `{ "level": "ERROR", "timestamp": "...", "requestPath": "..." }`
- `ERROR_REPORT`: `{ "stackTrace": "...", "environment": "production" }`

Priority: High.
Acceptance: `./start.sh --reset-db` produces 16+ rows in `agent_task`. Each seed row has a non-empty body. The accept/reject split is even (2 doable, 2 reject) per source.

---

### 2. Admin-Only Dashboard

#### REQ-003: Agent task dashboard route

A new page at `/admin/agent-tasks` in the Angular app.

- Protected with `canActivate: [roleGuard('ROLE_ADMIN')]` (the existing guard added in the geocoding PRD).
- No new permission string is needed. Use `roleGuard('ROLE_ADMIN')` only. Do NOT add any entry to `config/users.ts`.
- Not visible to the `user` account (role USER).
- Visible and accessible to `admin` and `demo` accounts (role ADMIN).

Backend route at `GET /api/agent-tasks` is protected by `requireRole('ADMIN')`.

Priority: High.
Acceptance: `user` account redirects away from `/admin/agent-tasks`. `admin` account sees the page. Non-authenticated request to `GET /api/agent-tasks` returns 401 (UnauthorizedError). Authenticated non-admin request to `GET /api/agent-tasks` returns 403 (ForbiddenError).

#### REQ-004: Source summary view

The dashboard landing page shows four Bootstrap cards — one per source. This is a deliberate choice: use Bootstrap cards here, not AG Grid.

Each card shows:
- Source label (human-readable: "Customer Emails", "GitHub Issues", "Application Logs", "Error Reports")
- Count of OPEN tasks
- Count of IN_PROGRESS tasks
- Count of DONE tasks
- Count of REJECTED tasks
- A link or button to drill into the task list for that source

The summary data comes from `GET /api/agent-tasks/summary` (see REQ-011b).

Priority: High.
Acceptance: Summary shows correct counts matching DB state. Counts update when user refreshes.

#### REQ-005: Task list per source

Clicking a source card opens a filtered list of tasks for that source.

Route shape: `/admin/agent-tasks?source=EMAIL` — source as a query param, read via `ActivatedRoute.queryParams`.

The list uses a plain Bootstrap table (simple admin view, not AG Grid).

List columns: ID, title, status, pickedUpAt (nullable), resolvedAt (nullable), truncated body preview.

Clicking a task row opens the task detail view.

Priority: High.
Acceptance: List shows only tasks for the selected source. Pagination applies (use standard Spring Data Page format matching existing pattern). All columns render.

#### REQ-006: Task detail view

A dedicated page for a single task.

Route: `/admin/agent-tasks/:id`.

Shows: title, source, status badge, body (full text, preformatted), metadata (formatted JSON), comment, createdAt, updatedAt, pickedUpAt, resolvedAt.

Priority: High.
Acceptance: All fields render. Status badge uses distinct colors (OPEN = blue/info, IN_PROGRESS = yellow/warning, DONE = green/success, REJECTED = red/danger). Body renders as preformatted text.

#### REQ-007: Sidebar entry

Add "Agent Tasks" to the sidebar under the Admin section.

- `requiredRole: 'ROLE_ADMIN'` on the sidebar item.
- Hidden for non-admin users.
- German label: `Agent-Aufgaben`.

Priority: Medium.
Acceptance: Admin sees the sidebar item. Non-admin does not.

---

### 3. Agent APIs and Security

#### REQ-008: Agent API — fetch next open task

`GET /api/agent-tasks/next?source=<SOURCE>`

- **Required query param: `source`** (`EMAIL`, `GITHUB_ISSUE`, `APP_LOG`, `ERROR_REPORT`). The caller MUST specify which task type it wants. Each GitHub Action / prompt runs per-source, so a source is always known. Missing `source` → 400. Value not in the enum whitelist → 400. There is no "fetch from any source" mode.
- Returns the oldest OPEN task (by `createdAt ASC`) for that source and **atomically claims it by setting `status = IN_PROGRESS`**.
- Uses a single atomic statement. The `OPEN → IN_PROGRESS` status flip is the claim guard (compare-and-swap): only a task still in `OPEN` can be selected, so two concurrent runners cannot both claim the same row, and a claimed task is never returned again.
  ```
  UPDATE agent_task
  SET status = 'IN_PROGRESS', pickedUpAt = now()
  WHERE id = (
    SELECT id FROM agent_task
    WHERE status = 'OPEN'
      AND source = ?
    ORDER BY createdAt ASC
    LIMIT 1
  )
  RETURNING *
  ```
- Returns 200 with the full task object (now `status: "IN_PROGRESS"`, `pickedUpAt` set) if an OPEN task is found.
- Returns 204 (no content) when no OPEN task matches the source.
- Note: a task left `IN_PROGRESS` (e.g. Claude crashed mid-task) is NOT re-claimed automatically — it stays `IN_PROGRESS` and is visible on the admin dashboard for a human to inspect. Resetting a stuck task back to `OPEN` is out of scope.

Priority: High.
Acceptance: With a valid `source`, returns oldest OPEN task, sets `status = IN_PROGRESS` and `pickedUpAt`. A second call returns the next OPEN task or 204 when none remain (the just-claimed task is not returned again). Missing `source` → 400. Invalid `source` value → 400.

#### REQ-009: Agent API — reject a task

`POST /api/agent-tasks/:id/reject`

Request body validated with Zod: `{ "comment": string }`. Non-empty string required. Missing or empty → 400 with `fieldErrors`.

- Guards: a task may be rejected only from a non-terminal status. If `task.status === 'DONE' || task.status === 'REJECTED'` → 409 ConflictError. Do not update. (Both `OPEN` and `IN_PROGRESS` are rejectable — the agent rejects after claiming, so the task is usually `IN_PROGRESS`.)
- Sets `status = REJECTED`, `comment = body.comment`, `resolvedAt = now()`, `updatedAt = now()`.
- Returns 200 with the updated task object.
- Returns 404 if task not found.

Priority: High.
Acceptance: Missing comment → 400 with fieldErrors. Valid call on an OPEN or IN_PROGRESS task → 200, status = REJECTED, comment stored, resolvedAt set. Already-DONE task → 409. Already-REJECTED task → 409.

#### REQ-010: Agent API — mark task done

`POST /api/agent-tasks/:id/done`

Request body validated with Zod: `{ "comment"?: string }`. Comment is optional.

- Guards: a task may be marked done only from a non-terminal status. If `task.status === 'DONE' || task.status === 'REJECTED'` → 409 ConflictError. Do not update. (Both `OPEN` and `IN_PROGRESS` are completable — the agent completes after claiming, so the task is usually `IN_PROGRESS`.)
- Sets `status = DONE`, `comment = body.comment ?? null`, `resolvedAt = now()`, `updatedAt = now()`.
- Returns 200 with the updated task object.
- Returns 404 if task not found.

Priority: High.
Acceptance: Valid call on an OPEN or IN_PROGRESS task → 200, status = DONE. Optional comment stored when provided. Already-REJECTED task → 409. Already-DONE task → 409.

#### REQ-011: Agent API — list all tasks (admin use)

`GET /api/agent-tasks`

- Returns paginated list. Supports query params: `source`, `status`, `page`, `size`, `sort`.
- Default sort: `createdAt,DESC`.
- Protected by `requireRole('ADMIN')` (not the agent token).

Priority: Medium.
Acceptance: Pagination, source and status filters all work. Returns standard Spring Data Page shape.

#### REQ-011b: Agent API — summary counts

`GET /api/agent-tasks/summary`

Returns per-source counts for the dashboard summary cards.

Response shape: `{ source: string, openCount: number, inProgressCount: number, doneCount: number, rejectedCount: number }[]`

One entry per source value (`EMAIL`, `GITHUB_ISSUE`, `APP_LOG`, `ERROR_REPORT`).

- Protected by `requireRole('ADMIN')` with session auth (not the agent token).
- Returns 401 for unauthenticated requests.
- Returns 403 for authenticated non-admin requests.

This endpoint resolves the `AgentTaskSummary` frontend model.

Priority: High.
Acceptance: Returns four objects, one per source. Counts match DB state. Auth behavior matches REQ-003 acceptance.

#### REQ-012: Shared-secret authentication for agent endpoints

The three agent-facing endpoints (`/next`, `/:id/reject`, `/:id/done`) use a dedicated middleware `requireAgentToken`.

Mechanism:
- Caller sends `Authorization: Bearer <token>` or `X-Agent-Token: <token>` header.
- Backend reads the env var `AGENT_API_TOKEN`.
- If `AGENT_API_TOKEN` is unset or empty → return 401 immediately. No comparison. No fallback. No default token ever.
- To prevent the `RangeError` that `crypto.timingSafeEqual` throws on buffers of unequal length: hash both the provided token and `AGENT_API_TOKEN` with SHA-256 first, then compare the two fixed-length digests with `crypto.timingSafeEqual`. Never compare raw strings of potentially different lengths.
- Match → call `next()`.
- No match or missing header → 401 with standard error shape.

Environment setup:
- Local: add `AGENT_API_TOKEN=<secret>` to a `.env` file in `backend/`. The `.env` file is already gitignored.
- GitHub Actions: store the same value as a repository secret named `AGENT_API_TOKEN`.

This middleware is distinct from session auth. It does not call `requireAuth`. These endpoints are safe for server-to-server use — no cookie, no CORS browser flow required.

Priority: High.
Acceptance: Request with correct token → 200. Request with wrong token → 401. Request with no header → 401. Unset `AGENT_API_TOKEN` → 401 on all agent endpoints. `GET /api/agent-tasks` (admin list) and `GET /api/agent-tasks/summary` still use session auth, not the token.

#### REQ-012b: Express route registration order

Literal sub-routes must be registered BEFORE any parameterized catch-all. Required order in the router file:

1. `GET /next`
2. `GET /summary`
3. `POST /:id/reject`
4. `POST /:id/done`
5. `GET /:id`
6. `GET /` (list)

If `/next` or `/summary` are registered after `/:id`, Express will match `next` and `summary` as id values and the endpoints will malfunction.

Priority: High.
Acceptance: `GET /api/agent-tasks/next` and `GET /api/agent-tasks/summary` return correct responses, not a 404 or task-not-found error.

---

### 4. Per-Source Prompt Files

#### REQ-013: Four per-source prompt files

Location: `.claude/prompts/`. One file per source.

Files:
- `.claude/prompts/agent-email.md`
- `.claude/prompts/agent-github-issue.md`
- `.claude/prompts/agent-app-log.md`
- `.claude/prompts/agent-error-report.md`

**CRITICAL — AUTONOMOUS MODE REQUIREMENT**

Claude Code runs headless via `claude -p` (print mode) in CI. In print mode, interactive prompts are not surfaced to any human. The `AskUserQuestion` checkpoints built into `.claude/skills/plan-and-do/SKILL.md` would hang the process indefinitely in a headless environment. Therefore:

Each prompt MUST operate in AUTONOMOUS mode. The prompt must pre-authorize every decision so no checkpoint waits for human input. Concretely, each prompt must:

1. Call `GET /api/agent-tasks/next?source=<SOURCE>` with the bearer token.
2. Read `title`, `body`, and `metadata`.
3. **Make the accept-vs-reject decision FIRST, before any implementation.**
   - Accept if: one clear solution exists, all needed context is in the body, the change is scoped to this codebase, no human decision is needed.
   - Reject if: problem is vague, solution is underspecified, multiple valid solutions exist, clarification is required, or required information is missing.
4. **If rejecting:** Call `POST /api/agent-tasks/:id/reject` with a mandatory comment explaining why. Then stop. Do NOT invoke plan-and-do.
5. **If accepting:** Invoke plan-and-do with the task body as the description. The prompt must pre-authorize every plan-and-do checkpoint decision in the prompt text:
   - Workflow scope = `full` (implement, review, create PR, merge).
   - Keep planning files (do not delete).
   - At every `AskUserQuestion` checkpoint, treat the response as "Continue" (or the recommended option) without waiting. The prompt text must state this explicitly so Claude applies it rather than pausing.
6. After plan-and-do completes and the PR is merged, call `POST /api/agent-tasks/:id/done` with a short resolution comment.
7. Exit.

Priority: High.
Acceptance: Each prompt file exists. Running `claude -p .claude/prompts/agent-email.md` locally results in Claude either calling the reject endpoint with a comment or invoking plan-and-do without pausing at checkpoints.

---

### 5. Sample GitHub Actions Workflow

#### REQ-014: Sample autonomous agent workflow

File: `.github/workflows/agent-task-runner.yml`

Trigger: `workflow_dispatch` (manual) and `schedule` (e.g. daily at 02:00 UTC).

Workflow structure:
1. Checkout repo.
2. Set up Node.js (same version as `deploy.yml`, using `.nvmrc`).
3. Install backend dependencies.
4. Set env var `AGENT_API_TOKEN` from `${{ secrets.AGENT_API_TOKEN }}`.
5. Set env var `APP_BASE_URL` pointing at the deployed app (from secret `APP_BASE_URL`).
6. Set env var `ANTHROPIC_API_KEY` from `${{ secrets.ANTHROPIC_API_KEY }}` — required for Claude Code to call the Anthropic API.
7. Run `claude -p .claude/prompts/agent-email.md` (default: email prompt). Pass the prompt file path as input.

Comments in the YAML must clearly state:
- This workflow does NOT run without secrets configured.
- Required secrets: `AGENT_API_TOKEN`, `APP_BASE_URL`, `ANTHROPIC_API_KEY`.
- The workflow is a reference implementation, not a production-ready auto-run.

Match the style of `.github/workflows/deploy.yml` (step naming conventions, `actions/checkout@v4`, `actions/setup-node@v4`, cache keys).

Priority: Medium.
Acceptance: YAML is valid (passes `yamllint`). Comments identify all three required secrets. Workflow does not auto-run in CI until secrets are set.

---

### 6. Local Test Plan

#### REQ-015: Step-by-step local test plan

Steps:
1. Start the app with seed data: `./start.sh --reset-db`. Wait for backend on port 7070 and frontend on port 7200.
2. Log in to the admin dashboard at `http://localhost:7200` with `admin` / `admin123`.
3. Navigate to "Agent-Aufgaben" in the sidebar. Verify: source summary shows 4 source cards, each with OPEN tasks.
4. Set a local token: `export AGENT_API_TOKEN=test-secret-123`. Add `AGENT_API_TOKEN=test-secret-123` to `backend/.env`.
5. Restart the backend to pick up the new env var: `cd backend && npx tsx --watch src/index.ts`.
6. Fetch the next EMAIL task:
   ```
   curl -s -H "Authorization: Bearer test-secret-123" \
     "http://localhost:7070/api/agent-tasks/next?source=EMAIL" | jq .
   ```
   Expected: a task JSON now showing `status: "IN_PROGRESS"` and a `pickedUpAt` timestamp (the fetch claimed it).
7. Reject a task manually (replace `<id>` with the returned id):
   ```
   curl -s -X POST \
     -H "Authorization: Bearer test-secret-123" \
     -H "Content-Type: application/json" \
     -d '{"comment": "Too vague to implement"}' \
     "http://localhost:7070/api/agent-tasks/<id>/reject" | jq .
   ```
   Expected: `status: "REJECTED"`, comment stored, `resolvedAt` set.
8. Refresh the admin dashboard. Verify: REJECTED count for EMAIL increases.
9. Run the email prompt with Claude Code locally:
   ```
   claude -p .claude/prompts/agent-email.md
   ```
   Watch Claude fetch the next OPEN unclaimed task, decide, and call reject or done without pausing for input.
10. Verify the dashboard reflects the updated status and stored comment.
11. To test a "doable" task end-to-end: reset the DB (`./start.sh --reset-db`), run the prompt again, and confirm Claude invokes plan-and-do, creates a branch and PR, then calls the done endpoint.

Note: secrets `AGENT_API_TOKEN` and `ANTHROPIC_API_KEY` are required even for local runs of `claude -p`. `APP_BASE_URL` is only needed in the GitHub Actions workflow.

Priority: High.
Acceptance: A developer can follow these steps on a Mac with Node.js 20.19+, curl, and jq. No GitHub Actions secrets needed for steps 1–10.

---

## Special Instructions

- Do NOT break any existing feature. All existing API endpoints, frontend routes, and tests must continue to pass.
- The `agent_task` table is additive. No existing table is modified.
- The agent endpoints bypass session auth. They must never interfere with the session-based auth used by the CRM UI.
- The `AGENT_API_TOKEN` env var must have safe default behavior: if the var is not set or is empty, all agent-token-protected endpoints return 401 immediately, before any comparison. Never fall back to a hardcoded default token.
- Shared-secret comparison: hash both tokens with SHA-256 first, then use `crypto.timingSafeEqual` on the fixed-length digests. This avoids the `RangeError` that `timingSafeEqual` throws when buffer lengths differ.
- Seed tasks are loaded via `fixture.json`. The `dataMigration.ts` seeding logic skips loading if any row already exists (checked via `SELECT COUNT(*) FROM firma`). `agent_task` seeds all-or-nothing with the rest of the fixture. Do not change this guard.
- Use English field names and status values in the DB (consistent with existing schema: `createdAt`, `updatedAt`, `status`, etc.).
- The admin dashboard uses Angular standalone components, `@if`/`@for` control flow, `inject()` for DI — consistent with the existing admin feature at `frontend/src/app/features/admin/`.
- Dashboard summary uses Bootstrap cards. Task list uses a plain Bootstrap table. Neither uses AG Grid.
- No new permission string needed for the admin dashboard. Use `roleGuard('ROLE_ADMIN')` only. Do NOT add entries to `config/users.ts`.
- **AUTONOMOUS MODE (CRITICAL):** Each per-source prompt runs Claude Code via `claude -p` (headless print mode). Interactive `AskUserQuestion` checkpoints in plan-and-do are never surfaced in print mode. Every prompt MUST pre-authorize all decisions in the prompt text itself (accept-vs-reject logic, workflow scope = full, all checkpoints = Continue). Claude makes the accept/reject decision first. If rejecting, it calls the reject API and stops — plan-and-do is never invoked. If accepting, it invokes plan-and-do with all decisions pre-stated so no checkpoint causes a hang. This requirement is non-negotiable for CI use.

---

## Implementation Approach

### Backend (high-level, no code)

1. Add `AgentTaskSource` and `AgentTaskStatus` enums to `backend/src/db/schema/enums.ts`.
2. Add `agentTask` table definition to `backend/src/db/schema/schema.ts`. Use `sql` tag for date defaults.
3. Add `CREATE TABLE IF NOT EXISTS agent_task (...)` and both indexes to `backend/src/config/migrate.ts`.
4. Update the `Fixture` interface in `dataMigration.ts` to include agent tasks. Add `agent_task` to the INSERT order and SQL map. Add seed rows to `backend/src/seed/fixture.json`.
5. Create `backend/src/services/agentTaskService.ts` with: `findNext(source?)` using the atomic UPDATE...RETURNING pattern, `reject(id, comment)` with OPEN guard, `done(id, comment?)` with OPEN guard, `findAll(filters, pagination)`, `findById(id)`, `getSummary()`.
6. Create `backend/src/middleware/agentAuth.ts` with `requireAgentToken` middleware. Hash both tokens with SHA-256 before `crypto.timingSafeEqual`. Return 401 immediately if `AGENT_API_TOKEN` is unset or empty.
7. Create `backend/src/routes/agentTasks.ts`. Register routes in this order: `GET /next`, `GET /summary`, `POST /:id/reject`, `POST /:id/done`, `GET /:id`, `GET /`. Agent endpoints use `requireAgentToken`. Admin endpoints use session auth + `requireRole('ADMIN')`. Use Zod to validate request bodies and the `source` query param.
8. Mount router in `backend/src/app.ts` at `/api/agent-tasks`.

### Frontend (high-level, no code)

1. Add `AgentTask`, `AgentTaskSource`, `AgentTaskStatus`, `AgentTaskSummary` model interfaces to `frontend/src/app/core/models/`. `AgentTaskSummary` maps to the `/summary` response shape: `{ source, openCount, doneCount, rejectedCount }`.
2. Create `AgentTaskService` in `frontend/src/app/core/services/`. Include calls for list (paginated), detail, and summary endpoints.
3. Create feature components under `frontend/src/app/features/admin/agent-tasks/`:
   - `AgentTasksDashboardComponent` — Bootstrap summary cards, reads from `/summary`.
   - `AgentTaskListComponent` — plain Bootstrap table, reads `source` from `ActivatedRoute.queryParams`, route `/admin/agent-tasks?source=EMAIL`.
   - `AgentTaskDetailComponent` — single task full view, route `/admin/agent-tasks/:id`.
4. Add routes in the admin routes file. Guard all with `roleGuard('ROLE_ADMIN')`. No new permission string.
5. Add sidebar entry `Agent-Aufgaben` with `requiredRole: 'ROLE_ADMIN'`.

### Prompts and workflow (high-level)

1. Write four prompt files in `.claude/prompts/`. Each prompt must pre-authorize all plan-and-do decisions. Make the accept/reject decision before any implementation step. See REQ-013 for the exact requirements.
2. Write `.github/workflows/agent-task-runner.yml`. Reference secrets `AGENT_API_TOKEN`, `APP_BASE_URL`, and `ANTHROPIC_API_KEY`.

---

## Test Strategy

### Backend (Playwright API tests under `backend/src/test/`)

- `GET /api/agent-tasks/next?source=EMAIL` with valid token and OPEN tasks → returns oldest EMAIL task, sets `status = IN_PROGRESS` and `pickedUpAt`.
- `GET /api/agent-tasks/next?source=EMAIL` → returns only EMAIL tasks (never another source).
- `GET /api/agent-tasks/next` with NO `source` param → 400.
- `GET /api/agent-tasks/next?source=EMAIL` repeated until empty → eventually 204; a claimed (IN_PROGRESS) task is never returned again.
- `GET /api/agent-tasks/next?source=INVALID` → 400.
- `POST /api/agent-tasks/:id/reject` with comment on an IN_PROGRESS task → 200, status REJECTED, comment stored.
- `POST /api/agent-tasks/:id/reject` with comment on an OPEN task → 200, status REJECTED.
- `POST /api/agent-tasks/:id/reject` without comment → 400 with fieldErrors.
- `POST /api/agent-tasks/:id/reject` on DONE task → 409.
- `POST /api/agent-tasks/:id/reject` on already-REJECTED task → 409.
- `POST /api/agent-tasks/:id/done` on an IN_PROGRESS task → 200, status DONE.
- `POST /api/agent-tasks/:id/done` on REJECTED task → 409.
- `POST /api/agent-tasks/:id/done` on already-DONE task → 409.
- All agent endpoints with wrong token → 401.
- All agent endpoints with no token → 401.
- `GET /api/agent-tasks` (admin list) with admin session → 200.
- `GET /api/agent-tasks` (admin list) with user session → 403 (ForbiddenError).
- `GET /api/agent-tasks` (admin list) unauthenticated → 401 (UnauthorizedError).
- `GET /api/agent-tasks` (admin list) with agent token → 401 (wrong auth type).
- `GET /api/agent-tasks/summary` with admin session → 200, four objects with correct source values.
- `GET /api/agent-tasks/summary` with user session → 403.
- `GET /api/agent-tasks/summary` unauthenticated → 401.

### Frontend (Jasmine/Karma)

- `AgentTasksDashboardComponent` renders four Bootstrap source cards with correct OPEN / IN_PROGRESS / DONE / REJECTED counts from the summary endpoint.
- `AgentTaskListComponent` renders tasks filtered by source (reads from `queryParams`).
- `AgentTaskDetailComponent` renders all fields; status badge uses correct Bootstrap color.
- Sidebar hides "Agent-Aufgaben" for non-admin user.
- `roleGuard('ROLE_ADMIN')` blocks USER role and permits ADMIN role.

---

## Non-Functional Requirements

- **Token security:** `requireAgentToken` uses SHA-256 hashing + `crypto.timingSafeEqual` on fixed-length digests. Missing or empty `AGENT_API_TOKEN` env var → 401 before any comparison. No fallback default. No new npm dependency (Node built-in `crypto` only).
- **No session bleed:** Agent endpoints do not read or write to the Express session. They are stateless bearer-token calls.
- **Admin-only gating:** Both backend (`requireRole('ADMIN')`) and frontend (`roleGuard('ROLE_ADMIN')` + sidebar `requiredRole`) enforce admin access to the dashboard. No new permission string.
- **Additive only:** Zero changes to existing tables, routes, services, or migrations.
- **Seed isolation:** The `firma`-count guard in `dataMigration.ts` is unchanged. `agent_task` seeds all-or-nothing with the rest of the fixture. Acceptable because the local test plan uses `--reset-db`.
- **Route ordering:** Literal routes (`/next`, `/summary`) registered before `/:id` catch-all to prevent path collision.
- **Atomic fetch:** `GET /next` uses a single atomic UPDATE...RETURNING to prevent race conditions in concurrent runs.
- **Autonomous prompts:** All per-source prompts run headless via `claude -p`. No checkpoint waits for human input.

---

## Success Criteria

- [ ] `./start.sh --reset-db` starts cleanly. The `agent_task` table and both indexes exist. 16+ seed rows covering all four sources are present.
- [ ] Admin user sees "Agent-Aufgaben" in the sidebar and can view the Bootstrap source summary cards, plain Bootstrap task list, and task detail.
- [ ] Non-admin user (`user` account) does not see the sidebar item and cannot reach `/admin/agent-tasks`.
- [ ] `GET /api/agent-tasks/next?source=EMAIL` with a valid bearer token returns the oldest OPEN EMAIL task and sets `status = IN_PROGRESS` + `pickedUpAt`. A claimed task is never returned again; when none remain → 204. A call with no `source` param returns 400.
- [ ] `POST /api/agent-tasks/:id/reject` without a comment returns 400. With a comment on an OPEN or IN_PROGRESS task, sets status REJECTED and stores the comment. On a DONE/REJECTED task → 409.
- [ ] `POST /api/agent-tasks/:id/done` sets status DONE from OPEN or IN_PROGRESS. On a DONE/REJECTED task → 409.
- [ ] All three agent endpoints return 401 for missing or wrong token. Unset `AGENT_API_TOKEN` → 401.
- [ ] `GET /api/agent-tasks` returns 401 for unauthenticated requests, 403 for the `user` account, 200 for the `admin` account.
- [ ] `GET /api/agent-tasks/summary` returns 401 for unauthenticated, 403 for non-admin, 200 with four source-count objects for admin.
- [ ] Four prompt files exist in `.claude/prompts/`. Running `claude -p .claude/prompts/agent-email.md` causes Claude to make the accept/reject decision first, then either call `/reject` with a comment (and stop) or invoke plan-and-do fully autonomously without pausing at checkpoints.
- [ ] `.github/workflows/agent-task-runner.yml` exists, is valid YAML, and comments list all three required secrets (`AGENT_API_TOKEN`, `APP_BASE_URL`, `ANTHROPIC_API_KEY`).
- [ ] All existing Playwright API tests and Karma frontend tests pass without modification.

---

## Local Test Plan

Follow REQ-015 above for the full step-by-step procedure.

Quick reference:

| Step | Command | Expected outcome |
|------|---------|-----------------|
| Start app with fresh seed | `./start.sh --reset-db` | Backend on 7070, frontend on 7200, 16+ agent tasks in DB |
| Open admin dashboard | Browser: `http://localhost:7200/admin/agent-tasks` as `admin` | Four Bootstrap source cards, OPEN counts match seed |
| Fetch next task | `curl -H "Authorization: Bearer <token>" "http://localhost:7070/api/agent-tasks/next?source=EMAIL"` | Task JSON, status IN_PROGRESS, pickedUpAt set |
| Fetch again | Same curl command | Next OPEN EMAIL task (claimed one is skipped); 204 once all are claimed |
| Reject task | `curl -X POST ... /api/agent-tasks/<id>/reject` with comment body | 200, status REJECTED, comment stored |
| Check dashboard | Browser refresh | REJECTED count incremented |
| Run prompt locally | `claude -p .claude/prompts/agent-email.md` | Claude fetches unclaimed task, decides accept/reject, calls correct API, no interactive pauses |
| Verify final state | Browser: task detail view | Status, comment, resolvedAt all correct |

---

## Implementation

Branch: `autonomous-task-sources-workshop` (PR targets `main`).

Key commits: agent_task table + seed (`106af13`), real-gap seed fix (`bda4f3d`), API + token middleware (`00f335a`), dashboard (`2b41981`), atomic guards + reset endpoint (`ca1aae0`), reset button (`8a89337`), prompts + CI + workshop guide + solve-all script (`a0dc538`), backend tests + resetDatabase fix (`125f4a3`), frontend specs (`d3ccece`), plus review fixes (list-filter validation + ISO timestamps; FE subscription/error/refresh) and the CLAUDE.md update.

Tests: backend 77 passed / 2 skipped; frontend 91 passed.

Added per user request during build: admin **reset** endpoint + button (re-run the demo without `--reset-db`), `docs/WORKSHOP-AUTONOMOUS-TASKS.md` (reset, Git-commit cleanup, solve-all instructions), and `scripts/solve-all-agent-tasks.sh`.

Later tweak (one task per run): `agent-task-runner.yml` now solves a single task per run — it tries the four sources in order, works/​rejects the FIRST open task, then stops (`MAX_TASKS_PER_RUN=1`), mirroring `MAX_ISSUES_PER_RUN=1` in the GitHub-issue runner. Remaining tasks are deferred to the next run. The local `scripts/solve-all-agent-tasks.sh` is intentionally left as a full drainer for demos.
