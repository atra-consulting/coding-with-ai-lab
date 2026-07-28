# AGENTS.md

Project knowledge for any AI coding assistant. Tool-specific configuration lives in
`CLAUDE.md` (Claude Code) and `GEMINI.md` (Gemini CLI) — both import this file.

## Project

Full-stack CRM application. Node.js/TypeScript (Express + Drizzle ORM + SQLite) backend, Angular 21 frontend. German domain model: Firma, Person, Abteilung, Adresse, Aktivitaet, Chance. SQLite file-based database at `backend/data/crmdb.sqlite`. Authentication via hardcoded in-memory users (`backend/src/config/users.ts`) with session-based auth (3 users: admin/admin123, user/test123, demo/demo1234 — all with full permissions).

## Build & Run

```bash
./start.sh                                        # Full stack (backend:7070 + frontend:7200)
./start.sh --reset-db                             # Delete SQLite database (recreated on startup)
cd backend && npx tsx --watch src/index.ts         # Backend only (with hot reload)
cd frontend && npx ng serve --port 7200 --proxy-config proxy.conf.json  # Frontend only
cd frontend && npx ng build                        # Frontend build check
```

**Prerequisites:** Node.js 20.19+ (checked by `start.sh`).

**Startup flow:** `runMigrations()` (DDL) → `runDataMigration()` (loads `backend/src/seed/fixture.json` when DB empty, skipped if rows exist) → server listens on port 7070.

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

## Specifications

Full system specs: [`docs/specs/SPECS.md`](docs/specs/SPECS.md) — root document linking to per-area specs (backend, frontend, infrastructure).
