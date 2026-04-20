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
│       │   ├── auth.ts         # requireRole / requirePermission guards
│       │   ├── cors.ts         # CORS setup
│       │   ├── errorHandler.ts # Global error handler
│       │   └── session.ts      # express-session configuration
│       ├── seed/
│       │   ├── dataMigration.ts # Loads fixture.json into the DB when empty
│       │   ├── fixture.json     # Fixed seed data (390 rows total)
│       │   └── build-fixture.ts # Dev tool: regenerates fixture.json after schema changes
│       └── utils/
│           ├── errors.ts       # Error types
│           ├── pagination.ts   # Spring Data page format helper
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
| memorystore | ^1.6.7 | In-memory session store |
| better-sqlite3 | ^9.6.0 | SQLite driver |
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

- Engine: SQLite (via `better-sqlite3`)
- File path: `backend/data/crmdb.sqlite`
- Created automatically on first startup
- Schema: Drizzle ORM definitions in `backend/src/db/schema/schema.ts`
- Migrations: Plain `CREATE TABLE IF NOT EXISTS` statements in `backend/src/config/migrate.ts`. Run on every startup.
- `PRAGMA foreign_keys = ON` — set on every connection. Required for cascade deletes.
- Tables: firma, person, abteilung, adresse, gehalt, aktivitaet, vertrag, chance

### Authentication

No separate auth database. Users are hardcoded in `backend/src/config/users.ts`.

Three users: `admin`, `user`, `demo`.

Sessions stored in memory via `memorystore`. No JWT. No RSA keys.

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

1. `runMigrations()` — creates tables if they do not exist
2. `runDataMigration()` — inserts fixture data from `backend/src/seed/fixture.json` if database is empty
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

One optional variable:

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 7070 | Backend HTTP port |

No JWT secrets. No RSA key paths. No CORS origin variables. No cookie flags.

## Documentation

| Directory | Contents |
|-----------|---------|
| docs/architecture.md | System overview |
| docs/adr/ | Architecture Decision Records |
| docs/prds/ | Product Requirement Documents |
| docs/uxdr/ | UX Design Records |
| docs/reviews/ | Code review reports |
| docs/specs/ | System specifications (this) |

## No CI/CD

No Docker, GitHub Actions, GitLab CI, or other pipeline configurations. Local development only.
