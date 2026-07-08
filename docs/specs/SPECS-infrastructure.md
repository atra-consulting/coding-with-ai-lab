# Infrastructure Specification

## Project Structure

```
coding-with-ai-lab/
├── api/
│   └── index.ts                # Vercel serverless entry — wraps Express app; runs migrations on cold start
├── vercel.json                 # Vercel build config, rewrites, and daily cron schedule
├── backend/                    # CRM Backend (Node.js, TypeScript, Express)
│   ├── package.json
│   ├── data/                   # SQLite database file (gitignored; local dev only)
│   │   └── crmdb.sqlite
│   └── src/
│       ├── index.ts            # Entry point — loads env, runs migrations, seeds, starts server
│       ├── app.ts              # Express app setup
│       ├── config/
│       │   ├── db.ts           # libSQL/Turso client + Drizzle ORM instance; local file or Turso URL
│       │   ├── loadEnv.ts      # Zero-dependency .env loader (must import first in index.ts)
│       │   ├── migrate.ts      # CREATE TABLE statements (run on startup)
│       │   ├── cronJobs.ts     # CRON_JOBS registry (name, schedule, dispatchEventType)
│       │   └── users.ts        # In-memory users + permissions
│       ├── db/schema/
│       │   ├── schema.ts       # Drizzle table definitions (6 CRM entities + agent_task, cron_run, sessions)
│       │   └── enums.ts        # TypeScript enums
│       ├── routes/             # Express route handlers (one per entity)
│       ├── services/           # Business logic (one per entity + cronService.ts)
│       ├── middleware/
│       │   ├── auth.ts         # requireAuth / requireRole guards
│       │   ├── agentAuth.ts    # requireAgentToken (SHA-256 + timingSafeEqual)
│       │   ├── cors.ts         # CORS setup
│       │   ├── errorHandler.ts # Global error handler
│       │   ├── libsqlSessionStore.ts  # Custom express-session Store backed by the sessions table
│       │   └── session.ts      # express-session configuration (uses LibsqlSessionStore)
│       ├── seed/
│       │   ├── dataMigration.ts  # Loads fixture.json into the DB when empty (CRM entities)
│       │   ├── fixture.json      # Fixed seed data (390 rows total, CRM entities only)
│       │   ├── agentTaskSeed.ts  # Idempotent agent_task seeding (INSERT OR IGNORE, ids 1–16)
│       │   └── build-fixture.ts  # Dev tool: regenerates fixture.json after schema changes
│       └── utils/
│           ├── asyncHandler.ts # Wraps async route handlers; forwards errors to Express error handler
│           ├── errors.ts       # Error types
│           ├── githubDispatch.ts  # Fires GitHub repository_dispatch events (for cron/agent workflows)
│           ├── pagination.ts   # Spring-Data-style page format helper (naming only; backend is Node)
│           └── validation.ts   # Zod validation helpers
├── frontend/                   # Angular 21 SPA
│   ├── package.json
│   ├── angular.json
│   ├── proxy.conf.json
│   └── src/app/
│       ├── core/               # Services, models, guards, interceptors
│       ├── features/           # Feature components (one per entity)
│       ├── shared/             # Shared components (loading-spinner, notification, confirm-dialog) and pipes
│       └── layout/             # Navbar, sidebar
├── .github/
│   └── workflows/
│       ├── deploy.yml                 # Test + deploy to Vercel on push to main
│       ├── agent-task-runner.yml      # Autonomous agent for OPEN agent_task rows
│       ├── do-factory-automatic.yml   # /do-factory-automatic skill — one agent_task per run, opens a PR
│       ├── do-semi-automatic.yml      # /do-semi-automatic skill — one Kanban ticket per run, opens a PR
│       └── github-issue-agent.yml     # GitHub-issue refinement agent
├── docs/
│   ├── adr/                    # Architecture Decision Records
│   ├── prds/                   # Product Requirement Documents
│   ├── uxdr/                   # UX Design Records
│   ├── reviews/                # Code reviews
│   └── specs/                  # This specification
├── .claude/
│   ├── agents/                 # Claude agents
│   └── skills/                 # Claude skills
├── start.sh                    # Full-stack launcher
├── CLAUDE.md                   # AI coding instructions
└── README.MD                   # Project overview
```

## Dependencies

### Backend (package.json)

Runtime: Node.js 20.19+. Language: TypeScript. Executed via `tsx`.

| Dependency | Version | Purpose |
|-----------|---------|---------|
| express | ^4.21.2 | HTTP server and routing |
| express-session | ^1.18.1 | Session-based authentication |
| @libsql/client | ^0.17.3 | libSQL/Turso database driver (local file or remote Turso) |
| drizzle-orm | ^0.41.0 | Type-safe ORM for libSQL/SQLite |
| bcryptjs | ^2.4.3 | Password hashing |
| cors | ^2.8.5 | CORS middleware |
| zod | ^3.23.8 | Runtime input validation |

Dev dependencies:

| Dependency | Version | Purpose |
|-----------|---------|---------|
| tsx | ^4.19.4 | TypeScript execution + hot reload |
| typescript | ^5.8.3 | TypeScript compiler |
| @playwright/test | ^1.52.0 | End-to-end tests |
| @types/* | various | TypeScript type definitions |

### Frontend (package.json)

| Dependency | Version | Purpose |
|-----------|---------|---------|
| @angular/* | ^21.2.1 | Angular framework |
| @angular/cdk | ^21.2.1 | Component Dev Kit |
| @ng-bootstrap/ng-bootstrap | ^20.0.0 | Bootstrap UI components |
| bootstrap | ^5.3.8 | CSS framework |
| @fortawesome/angular-fontawesome | ^4.0.0 | Icon components |
| @fortawesome/fontawesome-svg-core | ^7.2.0 | Icon core library |
| @fortawesome/free-solid-svg-icons | ^7.2.0 | Solid icon set |
| ag-grid-angular | ^35.1.0 | Data grid component |
| ag-grid-community | ^35.1.0 | Data grid core |
| chart.js | ^4.5.1 | Chart rendering |
| ng2-charts | ^10.0.0 | Angular chart wrapper |
| qrcode | ^1.5.4 | QR code generation |
| rxjs | ~7.8.0 | Reactive programming |
| zone.js | ~0.15.0 | Angular change detection |

Dev dependencies:

| Dependency | Version | Purpose |
|-----------|---------|---------|
| @angular/cli | ^21.2.1 | Angular build tooling |
| @angular/build | ^21.2.1 | Vite-based builder |
| @angular/compiler-cli | ^21.2.1 | Template compilation |
| typescript | ~5.9.2 | TypeScript compiler |
| karma + jasmine | various | Unit test runner |

## Database

### CRM Database

- Engine: SQLite/libSQL via `@libsql/client`
- Local file path: `backend/data/crmdb.sqlite` (created automatically on first startup)
- Remote: Turso cloud database when `TURSO_DATABASE_URL` is set (used on Vercel)

Schema file paths, migration approach, table definitions, column specs, and enums: see [SPECS-database.md](SPECS-database.md).

### Authentication

No separate auth database. Users are hardcoded in `backend/src/config/users.ts`.

Three users: `admin`, `user`, `demo`.

Sessions stored in the `sessions` table via `LibsqlSessionStore` (`backend/src/middleware/libsqlSessionStore.ts`). Uses the same libSQL/Turso connection as the rest of the app. No JWT. No RSA keys.

## Startup

### start.sh

Launches full stack in order:

1. **Backend** (Port 7070) — installs npm dependencies if missing, starts with `npx tsx --watch`
2. Waits for `GET /api/health` to return HTTP 200
3. **Frontend** (Port 7200) — installs npm dependencies if missing, starts with `npx ng serve`

Flags:
- `--reset-db` — Delete `backend/data/` before starting. Database recreates with seed data on next startup.

### Manual Start

```bash
# Backend only (with hot reload)
cd backend && npx tsx --watch src/index.ts

# Frontend only
cd frontend && npx ng serve --port 7200 --proxy-config proxy.conf.json

# Frontend build check (no server)
cd frontend && npx ng build
```

### Startup Sequence (index.ts)

1. `runMigrations()` — creates tables if they do not exist; also calls `seedAgentTasks()` (INSERT OR IGNORE, ids 1–16) so `agent_task` rows exist on every startup including Vercel cold-starts
2. `runDataMigration()` — inserts CRM fixture data from `backend/src/seed/fixture.json` if database is empty; skipped if rows exist
3. `app.listen(7070)` — starts the HTTP server

## Configuration

### Ports

| Service | Port |
|---------|------|
| Backend | 7070 |
| Frontend | 7200 |

### Proxy

`frontend/proxy.conf.json` forwards all `/api` requests to the backend.

```json
{
  "/api": {
    "target": "http://localhost:7070",
    "secure": false,
    "changeOrigin": true
  }
}
```

No split routing. All API traffic goes to a single backend.

### Environment Variables

Loaded from `backend/.env` (local dev) or set as real env vars (CI/Vercel). Real env vars always win over `.env`.

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| PORT | 7070 | No | Backend HTTP port |
| SESSION_SECRET | `crm-dev-secret-key` | No | express-session signing secret |
| CORS_ORIGINS | `http://localhost:7200` | No | Allowed CORS origins (comma-separated) |
| NODE_ENV | (unset) | No | `production` disables the `/api/auth/test-login` helper |
| TURSO_DATABASE_URL | (unset) | Yes (Vercel) | libSQL/Turso remote URL. When set, uses Turso instead of the local SQLite file. Required on Vercel (read-only filesystem). |
| TURSO_AUTH_TOKEN | (unset) | Yes (Vercel) | Auth token for Turso. Required when `TURSO_DATABASE_URL` is set. |
| AGENT_API_TOKEN | (unset) | Yes (Vercel + GitHub Actions) | Shared secret for the `/api/agent-tasks` endpoints. Verified via SHA-256 + `timingSafeEqual`. |
| CRON_SECRET | (unset) | Yes (Vercel) | Bearer token Vercel sends in the `Authorization` header when calling `/api/cron/agent-tasks`. When unset, the cron bearer path is disabled; admin session still works. |

No JWT secrets. No RSA key paths. No cookie-flag overrides.

## Documentation

| Directory | Contents |
|-----------|---------|
| docs/adr/ | Architecture Decision Records |
| docs/prds/ | Product Requirement Documents |
| docs/uxdr/ | UX Design Records |
| docs/reviews/ | Code review reports |
| docs/specs/ | System specifications (this) |

## CI/CD

Five GitHub Actions workflows in `.github/workflows/`:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `deploy.yml` | Push to `main` (after tests pass) | Runs backend type-check + Playwright tests, frontend unit tests + build, then deploys to Vercel (production) |
| `agent-task-runner.yml` | `repository_dispatch` event `solve-agent-tasks` | Runs the autonomous agent against OPEN `agent_task` rows |
| `do-factory-automatic.yml` | `repository_dispatch` event `solve-agent-tasks`; also `workflow_dispatch`, daily `schedule` | Runs the `/do-factory-automatic` skill against one OPEN `agent_task`; pushes a branch and opens a PR (never merges) |
| `do-semi-automatic.yml` | `repository_dispatch` event `solve-tickets` (dormant — no cron dispatches it yet); also `workflow_dispatch`, daily `schedule` | Runs the `/do-semi-automatic` skill against one Ready+AI Kanban ticket; pushes a branch and opens a PR (never merges) |
| `github-issue-agent.yml` | `repository_dispatch` event `solve-github-issues` | Runs the GitHub-issue refinement agent against one labelled issue |

### Vercel Deployment

- Entry point: `api/index.ts` — serverless function that wraps the Express app
- Config: root `vercel.json` — build command, output directory, rewrites, and Vercel cron schedule
- Build: `cd frontend && npm ci && npx ng build`; backend sources bundled by Vercel's esbuild via `api/index.ts`
- Rewrites: `/api/*` → `api/index`; everything else → `index.html` (Angular SPA)
- Vercel cron: `GET /api/cron/agent-tasks` at `0 2 * * *` (daily 02:00 UTC)
- Cloud database: Turso (libSQL) when `TURSO_DATABASE_URL` is set — required on Vercel (read-only filesystem)
