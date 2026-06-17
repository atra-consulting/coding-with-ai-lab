# Infrastructure Specification

## Project Structure

```
coding-with-ai-lab/
├── backend/                    # CRM Backend (Node.js, TypeScript, Express)
│   ├── package.json
│   ├── data/                   # SQLite database file (gitignored)
│   │   └── crmdb.sqlite
│   └── src/
│       ├── index.ts            # Entry point — runs migrations, seeds, starts server
│       ├── app.ts              # Express app setup
│       ├── config/
│       │   ├── db.ts           # SQLite connection + Drizzle ORM instance
│       │   ├── migrate.ts      # CREATE TABLE statements (run on startup)
│       │   └── users.ts        # In-memory users + permissions
│       ├── db/schema/
│       │   ├── schema.ts       # Drizzle table definitions
│       │   └── enums.ts        # TypeScript enums
│       ├── routes/             # Express route handlers (one per entity)
│       ├── services/           # Business logic (one per entity)
│       ├── middleware/
│       │   ├── auth.ts         # requireAuth / requireRole guards
│       │   ├── cors.ts         # CORS setup
│       │   ├── errorHandler.ts # Global error handler
│       │   ├── session.ts      # express-session configuration
│       │   └── libsqlSessionStore.ts # DB-backed session store (sessions table)
│       ├── seed/
│       │   ├── dataMigration.ts  # Loads fixture.json into the DB when empty (CRM entities)
│       │   ├── fixture.json      # Fixed seed data (390 rows total, CRM entities only)
│       │   ├── agentTaskSeed.ts  # Idempotent agent_task seeding (INSERT OR IGNORE, ids 1–16)
│       │   └── build-fixture.ts  # Dev tool: regenerates fixture.json after schema changes
│       └── utils/
│           ├── errors.ts       # Error types
│           ├── pagination.ts   # Spring-Data-style page format helper (naming only; backend is Node)
│           └── validation.ts   # Zod validation helpers
├── frontend/                   # Angular 21 SPA
│   ├── package.json
│   ├── angular.json
│   ├── proxy.conf.json
│   └── src/app/
│       ├── core/               # Services, models, guards, interceptors
│       ├── features/           # Feature components (one per entity)
│       └── layout/             # Navbar, sidebar
├── docs/
│   ├── architecture.md
│   ├── adr/                    # Architecture Decision Records
│   ├── prds/                   # Product Requirement Documents
│   ├── uxdr/                   # UX Design Records
│   ├── reviews/                # Code reviews
│   └── specs/                  # This specification
├── api/                        # Vercel serverless entry (api/index.ts wraps the Express app)
├── .github/workflows/          # GitHub Actions (deploy + agent runners)
├── vercel.json                 # Vercel build, rewrites, and cron config
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
| express-session | ^1.18.1 | Session-based authentication (DB-backed store) |
| @libsql/client | ^0.17.3 | libSQL/SQLite driver (async API) |
| drizzle-orm | ^0.41.0 | Type-safe ORM for SQLite |
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

- Engine: SQLite via `@libsql/client` (libSQL, async API) wired into Drizzle through `drizzle-orm/libsql`
- File path: `backend/data/crmdb.sqlite` (path resolved relative to `src/config/db.ts` via `__dirname`, so it is correct regardless of working directory). The client uses the `file:` URL scheme by default.
- Created automatically on first startup (the data dir is created only when running file-based, not on Vercel)
- Remote libSQL/Turso is optionally supported: if `TURSO_DATABASE_URL` (and optional `TURSO_AUTH_TOKEN`) are set, the client connects to that remote URL instead of the local file. Used for deployment; local development is file-based.

Schema file paths, migration approach, table definitions, column specs, and enums: see [SPECS-database.md](SPECS-database.md).

### Authentication

No separate auth database. Users are hardcoded in `backend/src/config/users.ts`.

Three users: `admin`, `user`, `demo`.

Sessions are stored in the database via a custom store, `backend/src/middleware/libsqlSessionStore.ts` (`sessions` table), wired into `express-session` in `backend/src/middleware/session.ts` (cookie name `JSESSIONID`). No JWT. No RSA keys.

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

All optional, with defaults:

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 7070 | Backend HTTP port |
| SESSION_SECRET | `crm-dev-secret-key` | express-session signing secret |
| CORS_ORIGINS | `http://localhost:7200` | Allowed CORS origins |
| NODE_ENV | (unset) | `production` disables the `/api/auth/test-login` helper |
| TURSO_DATABASE_URL | (unset) | When set, connects the libSQL client to a remote libSQL/Turso URL instead of the local file (deployment) |
| TURSO_AUTH_TOKEN | (unset) | Auth token for the remote libSQL/Turso connection |

No JWT secrets. No RSA key paths. No cookie-flag overrides.

## Documentation

| Directory | Contents |
|-----------|---------|
| docs/architecture.md | System overview |
| docs/adr/ | Architecture Decision Records |
| docs/prds/ | Product Requirement Documents |
| docs/uxdr/ | UX Design Records |
| docs/reviews/ | Code review reports |
| docs/specs/ | System specifications (this) |

## CI/CD & Deployment

### GitHub Actions (`.github/workflows/`)

| Workflow | Purpose |
|----------|---------|
| `deploy.yml` | Deployment workflow |
| `agent-task-runner.yml` | Runs Claude Code against the `agent_task` table (EMAIL / GITHUB_ISSUE / APP_LOG / ERROR_REPORT sources) |
| `agent-issue-runner.yml` | Runs Claude Code against real GitHub issues from the org Project board |

### Vercel deployment

- `vercel.json` configures the build (`cd frontend && npm ci && npx ng build`), SPA rewrites, an `/api/*` rewrite to the serverless function, and a daily cron (`0 2 * * *`) hitting `/api/cron/agent-tasks`.
- `api/index.ts` is the Vercel serverless entry point that wraps the Express app.
- On Vercel the libSQL client connects to a remote libSQL/Turso URL (via `TURSO_DATABASE_URL`) since the filesystem is read-only.

No Docker or GitLab CI.
