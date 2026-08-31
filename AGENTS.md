# AGENTS.md

Project knowledge for any AI coding assistant. Claude-Code-specific configuration
(subagents, spec reading lists) lives in [`CLAUDE.md`](CLAUDE.md), which imports
this file.

## Project

Full-stack CRM application. Node.js/TypeScript (Express + Drizzle ORM + libSQL/SQLite via `@libsql/client`) backend, Angular 21 frontend. German domain model: Firma, Person, Abteilung, Adresse, Aktivitaet, Chance. Local SQLite file at `backend/data/crmdb.sqlite`; production runs on Turso cloud when `TURSO_DATABASE_URL` is set. Authentication via hardcoded users (`backend/src/config/users.ts`, bcrypt-hashed passwords), session-based and persisted to the `sessions` table (`LibsqlSessionStore`). 3 users: admin/admin123 (ADMIN), user/test123 (USER), demo/demo1234 (ADMIN). Enforcement is role-based via `requireRole('ADMIN')`; users also carry a `permissions` array, but no `requirePermission` middleware is wired up.

### Autonomous Agents (advanced workshop)

Two independent Claude-Code-in-CI agents. Both are documented in full in [`docs/specs/SPEC-API-TASKS.md`](docs/specs/SPEC-API-TASKS.md).

- **Agent-task runner** — drains the `agent_task` table (sources `EMAIL`, `GITHUB_ISSUE`, `APP_LOG`, `ERROR_REPORT`; lifecycle `OPEN → IN_PROGRESS → DONE | REJECTED`) via the `/api/agent-tasks` API, decides solve-or-reject, implements, and merges. Admin dashboard at `/admin/agent-tasks`. Workflow `.github/workflows/agent-task-runner.yml`, prompts `.claude/prompts/agent-*.md`.
- **GitHub-issue agent** — works real GitHub issues labelled `Refinement needed`, one per run, triggered from the `solve-github-issues` card in `/admin/cron`. Implements-or-asks; opens a PR against `main` (never merged) or comments a question and adds `Input needed`. Status tracked on GitHub Project board #7. Workflow `.github/workflows/github-issue-agent.yml`, prompt `.claude/prompts/agent-github-refinement.md`.

Agent endpoints authenticate with `requireAgentToken` (`AGENT_API_TOKEN`); cron triggers with `requireCronAuth` (`CRON_SECRET` or admin session). See [`docs/specs/SPEC-API-TASKS.md`](docs/specs/SPEC-API-TASKS.md) for endpoint signatures, required secrets, and board mechanics.

### Ticket System (Kanban, advanced workshop)

A fake ticketing system for the software-factory training. Sits beside `agent-tasks`. Full docs in [`docs/specs/SPEC-API-TICKETS.md`](docs/specs/SPEC-API-TICKETS.md).

- `ticket` + `ticket_comment` tables. Kanban board with five columns: `DEFINITION` (intake, labelled "Definition"), `TODO` (labelled "Bereit"), `IN_PROGRESS`, `ON_HOLD`, `DONE`. `status` is a DB enum (`CHECK` constraint). Each ticket has an **owner** — `AI` or `HUMAN`. New tickets start `owner=HUMAN`, `status=DEFINITION`. A human refines a Definition ticket then routes it: **"An KI übergeben"** (`PATCH /:id/owner {AI}` → owner=AI, stays in `DEFINITION`) or **"Nach Bereit"** (`POST /:id/hand-to-ai` → owner=AI, →`TODO`). A coding agent works `AI` tickets; humans work the rest.
- The agent claims (`GET /api/tickets/next`), finishes (`POST /:id/done`), or **asks a question** (`POST /:id/ask` → `ON_HOLD`, owner back to `HUMAN`, question posted as an `AGENT` comment). A human answers via `POST /:id/comments` with `handBackToAi` → back to `TODO`, owner `AI`. Comments form a thread.
- Resolution: `done` sets `solution=DONE`; an admin can set `solution=WONT_DO` (`POST /:id/wont-do`, only on `owner=HUMAN` tickets). Most agent endpoints use `requireAgentTokenOrAdminSession` (agent token, loopback bypass, or admin session); only `GET /next` stays agent-token-only. Admin-only endpoints use `requireAuth` + `requireRole('ADMIN')`. Drag-and-drop admin board at `/admin/tickets`. Seeded with the 12 workshop specs; `POST /api/tickets/reset` re-seeds.

## Writing Style

When writing Markdown (specs, plans, docs, reviews): as short & brief as possible. Short sentences. Simple words non-native speakers understand. No passive voice. Use sentence fragments.

## Build & Run

```bash
./start.sh                                        # Full stack (backend:7070 + frontend:7200)
./start.sh --reset-db                             # Delete SQLite database (recreated on startup)
cd backend && npx tsx --watch src/index.ts         # Backend only (with hot reload)
cd frontend && npx ng serve --port 7200 --proxy-config proxy.conf.json  # Frontend only
cd frontend && npx ng build                        # Frontend build check
```

**Prerequisites:** Node.js 20.19+ (checked by `start.sh`).

**Startup flow:** `runMigrations()` (DDL + idempotent `agent_task` seeding via `seedAgentTasks()` — INSERT OR IGNORE, fixed ids 1–23, runs on every startup including Vercel cold-starts) → `runDataMigration()` (loads `backend/src/seed/fixture.json` for CRM entities when DB empty, skipped if rows exist) → server listens on port 7070.

**Hot reload during development:**
- **Backend:** `tsx --watch` restarts on file changes automatically.
- **Frontend:** Angular `ng serve` watches for file changes and reloads the browser automatically.

## Coding Conventions

### Backend

- **DB client**: `@libsql/client` is **async** — every service method `await`s `client.execute({ sql, args })`. No synchronous better-sqlite3 calls. Route handlers wrap async logic in `asyncHandler(...)` from `utils/asyncHandler.ts`.
- **SQLite dates**: All dates stored as ISO-8601 text strings. Use `new Date().toISOString()` for timestamps.
- **SQLite numeric**: The monetary column `wert` (in `chance`) is stored as REAL. Returned as JSON numbers.
- **PRAGMA foreign_keys**: Must be `ON` for cascade deletes to work. Set once at startup in `config/migrate.ts` (`runMigrations()`), not per-connection.
- **Sort parsing**: Sort arrives as query param `field,direction` (e.g., `name,asc`). Validated against per-entity field whitelists to prevent SQL injection.
- **Authorization**: Entity routes use `requireAuth` (login required); admin/cron routes use `requireRole('ADMIN')`. Both come from `middleware/auth.ts`, which exports only `requireAuth` and `requireRole` — there is **no** `requirePermission`. Agent endpoints use `requireAgentToken` (`middleware/agentAuth.ts`).
- **Error responses**: `{ status, message, timestamp, fieldErrors }` via global error handler in `middleware/errorHandler.ts`.
- **Pagination**: Response shape mimics the Spring Data Page format (name only — backend is Node): `{ content, totalElements, totalPages, size, number, first, last }`. `number` is 0-indexed.
- **Testing**: Backend uses Playwright (`@playwright/test`) for end-to-end API tests under `backend/src/test/`.

### Frontend

- **Angular 21 standalone components** — no NgModules, no `standalone: true` (it's the default). Use `imports: [...]` in `@Component`.
- **DI**: `private service = inject(Service)`, not constructor injection.
- **Control flow**: `@if`/`@for`/`@switch` blocks only, never `*ngIf`/`*ngFor`. `@for` requires `track`.
- **Pagination**: NgbPagination is 1-indexed, backend is 0-indexed. Convert with `this.currentPage - 1` in service calls.

## Adding a New Entity

Backend (3 files): Drizzle schema in `db/schema/schema.ts` + CREATE TABLE in `config/migrate.ts` → Service in `services/` → Route handler in `routes/`. **Route file must guard with `requireAuth`** (or `requireRole('ADMIN')` for admin-only routes).

Frontend (8+ files): Model interface → Service → Route file → List/Detail/Form components → register in `app.routes.ts` **with `canActivate: [authGuard]`** (add `roleGuard('ROLE_ADMIN')` for admin-only) + add the sidebar item (set `requiredRole: 'ROLE_ADMIN'` if admin-only).

**Access control is role-based.** Enforcement uses roles only: `requireRole('ADMIN')` on the backend, `roleGuard('ROLE_ADMIN')` on the frontend, `requiredRole` on the sidebar item. The per-user `permissions` array in `config/users.ts` exists on the model but is not enforced by any middleware — there is no permission guard or `requirePermission`.

## Commits & PRDs

- **Commit → PRD**: Wenn ein Commit eine PRD implementiert, Footer-Zeile in der Commit-Message: `PRD: docs/prds/<name>.md`
- **PRD → Commits**: Jede PRD enthält eine `## Implementierung`-Section mit Links zu den zugehörigen Commits und PRs.
- Beim Committen immer prüfen: Gibt es eine PRD unter `docs/prds/`, die zu dieser Änderung gehört? Falls ja, beides verknüpfen.

## Specifications

Full system specs: [`docs/specs/SPECS.md`](docs/specs/SPECS.md) — root index, one business-domain doc ([`DOMAIN.md`](docs/specs/DOMAIN.md)), plus six per-area specs (8 SPECS files total). `docs/specs/` also holds two API-reference docs — [`SPEC-API-TASKS.md`](docs/specs/SPEC-API-TASKS.md) and [`SPEC-API-TICKETS.md`](docs/specs/SPEC-API-TICKETS.md) — that document the agent-task and Kanban-ticket APIs.
