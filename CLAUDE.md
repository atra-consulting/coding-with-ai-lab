# CLAUDE.md

## Project

Full-stack CRM application. Node.js/TypeScript (Express + Drizzle ORM + SQLite) backend, Angular 21 frontend. German domain model: Firma, Person, Abteilung, Adresse, Aktivitaet, Chance. SQLite file-based database at `backend/data/crmdb.sqlite`. Authentication via hardcoded in-memory users (`backend/src/config/users.ts`) with session-based auth (3 users: admin/admin123, user/test123, demo/demo1234 — all with full permissions).

### Autonomous Task Sources (advanced workshop)

The `agent_task` table holds tasks from four sources (`EMAIL`, `GITHUB_ISSUE`, `APP_LOG`, `ERROR_REPORT`) with lifecycle `OPEN → IN_PROGRESS → DONE | REJECTED`. Claude Code, driven by GitHub Actions, pulls a task, decides solve-or-reject, implements it, and merges. Pieces:
- **API** `/api/agent-tasks`: `GET /next?source=X` (claims OPEN→IN_PROGRESS), `POST /:id/reject` (mandatory comment), `POST /:id/done`, `POST /reset` (admin), `GET /summary`, `GET /:id`, `GET /`. Agent endpoints use the `requireAgentToken` middleware (shared secret in env `AGENT_API_TOKEN`, SHA-256 + `timingSafeEqual`); admin endpoints use session + `requireRole('ADMIN')`. Full reference: [`docs/API-TASKS.md`](docs/API-TASKS.md).
- **Dashboard** (admin only): `/admin/agent-tasks` — summary cards, per-source list, task detail, reset button.
- **Prompts**: `.claude/prompts/agent-*.md` — one per source; run headless via `claude -p`, pre-authorizing every plan-and-do checkpoint.
- **CI**: `.github/workflows/agent-task-runner.yml` (reference; needs secrets `AGENT_API_TOKEN`, `APP_BASE_URL`, `ANTHROPIC_API_KEY`).
- **Workshop guide**: [`docs/WORKSHOP-AUTONOMOUS-TASKS.md`](docs/WORKSHOP-AUTONOMOUS-TASKS.md) — local testing, reset between runs, removing task-solution commits, `scripts/solve-all-agent-tasks.sh`.

A second runner sources **real GitHub issues** (not the `agent_task` table) from org Project board #7. It selects issues by label/status, decides solve-or-pause, runs plan-and-do (merge to main), and pauses unanswerable issues with an `Input needed` label + comment for a human to resolve. Pieces:
- **Selection rules**: OPEN issue picked when (label `Refinement needed` AND Status ≠ `Done`) OR (no `Refinement needed` AND Status in `In progress`/`In review`); any `Input needed` issue is skipped (both branches). See [`docs/prds/PRD-GH-ISSUE-AGENT-RUNNER.md`](docs/prds/PRD-GH-ISSUE-AGENT-RUNNER.md).
- **Prompt**: `.claude/prompts/agent-gh-board.md` — one GitHub issue per `claude -p` run via `ISSUE_NUMBER`.
- **Scripts**: `scripts/gh-issues-select.sh` (board selection), `scripts/gh-issue-status.sh get|set` (board Status), `scripts/solve-gh-board-issues.sh` (local runner).
- **CI**: `.github/workflows/agent-issue-runner.yml` (reference; needs secret `GH_PROJECT_TOKEN` — org-SSO PAT with `project`+`repo` — plus `ANTHROPIC_API_KEY`, and `AGENT_API_TOKEN`/`APP_BASE_URL` only for the optional cron callback).

## Build & Run

```bash
./start.sh                                        # Full stack (backend:7070 + frontend:7200)
./start.sh --reset-db                             # Delete SQLite database (recreated on startup)
cd backend && npx tsx --watch src/index.ts         # Backend only (with hot reload)
cd frontend && npx ng serve --port 7200 --proxy-config proxy.conf.json  # Frontend only
cd frontend && npx ng build                        # Frontend build check
```

**Prerequisites:** Node.js 20.19+ (checked by `start.sh`).

**Startup flow:** `runMigrations()` (DDL + idempotent `agent_task` seeding via `seedAgentTasks()` — INSERT OR IGNORE, fixed ids 1–16, runs on every startup including Vercel cold-starts) → `runDataMigration()` (loads `backend/src/seed/fixture.json` for CRM entities when DB empty, skipped if rows exist) → server listens on port 7070.

**Hot reload during development:**
- **Backend:** `tsx --watch` restarts on file changes automatically.
- **Frontend:** Angular `ng serve` watches for file changes and reloads the browser automatically.

## Coding Conventions

### Backend

- **SQLite dates**: All dates stored as ISO-8601 text strings. Use `new Date().toISOString()` for timestamps.
- **SQLite numeric**: Monetary values (`wert`, `amount`) stored as REAL. Returned as JSON numbers.
- **PRAGMA foreign_keys**: Must be `ON` for cascade deletes to work. Set on every connection in `config/db.ts`.
- **Sort parsing**: Sort arrives as query param `field,direction` (e.g., `name,asc`). Validated against per-entity field whitelists to prevent SQL injection.
- **Authorization**: Every route file uses `requireRole(...)` or `requirePermission(...)` middleware from `middleware/auth.ts`.
- **Error responses**: `{ status, message, timestamp, fieldErrors }` via global error handler in `middleware/errorHandler.ts`.
- **Pagination**: Response shape mimics the Spring Data Page format (name only — backend is Node): `{ content, totalElements, totalPages, size, number, first, last }`. `number` is 0-indexed.
- **Testing**: Backend uses Playwright (`@playwright/test`) for end-to-end API tests under `backend/src/test/`.

### Frontend

- **Angular 21 standalone components** — no NgModules, no `standalone: true` (it's the default). Use `imports: [...]` in `@Component`.
- **DI**: `private service = inject(Service)`, not constructor injection.
- **Control flow**: `@if`/`@for`/`@switch` blocks only, never `*ngIf`/`*ngFor`. `@for` requires `track`.
- **Pagination**: NgbPagination is 1-indexed, backend is 0-indexed. Convert with `this.currentPage - 1` in service calls.

## Adding a New Entity

Backend (3 files): Drizzle schema in `db/schema/schema.ts` + CREATE TABLE in `config/migrate.ts` → Service in `services/` → Route handler in `routes/`. **Route file must use `requireRole(...)` or `requirePermission(...)`**.

Frontend (8+ files): Model interface → Service → Route file → List/Detail/Form components → register in `app.routes.ts` **with `canActivate: [permissionGuard('PERMISSION')]`** + add `permission: 'PERMISSION'` to sidebar item.

**Adding a new permission**: Add the permission string to the user's permissions array in `config/users.ts` → use `requirePermission('NAME')` on route → add `permissionGuard('NAME')` on frontend route + `permission: 'NAME'` on sidebar item.

## Commits & PRDs

- **Commit → PRD**: Wenn ein Commit eine PRD implementiert, Footer-Zeile in der Commit-Message: `PRD: docs/prds/<name>.md`
- **PRD → Commits**: Jede PRD enthält eine `## Implementierung`-Section mit Links zu den zugehörigen Commits und PRs.
- Beim Committen immer prüfen: Gibt es eine PRD unter `docs/prds/`, die zu dieser Änderung gehört? Falls ja, beides verknüpfen.

## Agents

| Agent | Purpose | Type |
|-------|---------|------|
| admin | Local dev environment, SQLite database, process management | ops |
| ba-reviewer | Review PRDs, specs, plans for gaps and issues | review |
| ba-writer | Create business specs, requirements, plans | writing |
| be-coder | Node.js / TypeScript backend code | coding |
| be-reviewer | Review backend code, security, patterns | review |
| db-coder | Drizzle ORM queries, entity schemas, data access | coding |
| db-reviewer | Review queries, Drizzle mappings, performance | review |
| fe-coder | Angular 21 frontend code, components, services | coding |
| fe-reviewer | Review frontend code, patterns, accessibility | review |
| ui-designer | UI/UX design, layout, styling, accessibility | coding |
| ui-reviewer | Critical UI evaluation, usability, WCAG audit | review |
| be-test-coder | Write Playwright API tests for the backend | test-coding |
| be-test-reviewer | Review backend Playwright tests | test-review |
| be-test-runner | Execute backend Playwright suite, report pass/fail | test-runner |
| fe-test-coder | Write Jasmine/Karma unit tests for the frontend | test-coding |
| fe-test-reviewer | Review frontend Jasmine/Karma tests | test-review |
| fe-test-runner | Execute frontend Karma suite, report pass/fail | test-runner |

Agent files: `.claude/agents/`

## Specifications

Full system specs: [`docs/specs/SPECS.md`](docs/specs/SPECS.md) — root index plus six per-area specs (7 files total). Each subagent in `.claude/agents/` has a `## Specifications` reading list naming its primary spec plus secondary specs.

| Spec | Scope | Primary for |
|------|-------|-------------|
| [`SPECS.md`](docs/specs/SPECS.md) | Root index, architecture, tech stack, domain model, seed data | ba-writer, ba-reviewer |
| [`SPECS-backend.md`](docs/specs/SPECS-backend.md) | Backend API: routes, services, auth, errors, pagination, code patterns | be-coder, be-reviewer |
| [`SPECS-database.md`](docs/specs/SPECS-database.md) | Entities, schema, columns, enums, foreign keys, migrations | db-coder, db-reviewer |
| [`SPECS-frontend.md`](docs/specs/SPECS-frontend.md) | Angular architecture, routing, auth, guards, models, services, components | fe-coder, fe-reviewer |
| [`SPECS-ui.md`](docs/specs/SPECS-ui.md) | Styling, design system, AG Grid, layout & shared components | ui-designer, ui-reviewer |
| [`SPECS-testing.md`](docs/specs/SPECS-testing.md) | Playwright backend API tests, Jasmine/Karma frontend unit tests | be-test-*, fe-test-* |
| [`SPECS-infrastructure.md`](docs/specs/SPECS-infrastructure.md) | Build, config, DB engine, startup, project structure | admin |
